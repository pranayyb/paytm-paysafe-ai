import re
import time
import os
import json
import requests
import tempfile
from pathlib import Path
from gtts import gTTS
from sqlalchemy.orm import Session
from models import User, Transaction
from services.trust_score import calculate_trust_score
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

HINDI_NUMBERS = {
    "ek": 1, "do": 2, "teen": 3, "char": 4, "paanch": 5,
    "chhah": 6, "saat": 7, "aath": 8, "nau": 9, "das": 10,
    "gyarah": 11, "barah": 12, "bis": 20, "pachas": 50,
    "sau": 100, "hazaar": 1000, "hazar": 1000, "lakh": 100000, "crore": 10000000
}

# Amount extraction patterns
AMOUNT_PATTERNS = [
    re.compile(r'₹\s*([\d,]+)', re.IGNORECASE),
    re.compile(r'([\d,]+)\s*(?:rupees?|rupye|rupaye|rs\.?)', re.IGNORECASE),
    re.compile(r'(?:amount|paisa|paise)\s*(?:of|ka)?\s*([\d,]+)', re.IGNORECASE),
    re.compile(r'([\d,]+)\s*(?:bhejo|bhej|transfer|send|de do|dedo)', re.IGNORECASE),
    re.compile(r'(?:bhejo|bhej|transfer|send|de do|dedo)\s*([\d,]+)', re.IGNORECASE),
]

# Receiver name extraction
NAME_PATTERNS = [
    re.compile(r'(\w+)\s+ko\s+(?:[\d,]+|₹)', re.IGNORECASE),  # "Rahul ko 500"
    re.compile(r'(\w+)\s+(?:ke liye|ke account|ka account|wale ko)', re.IGNORECASE),
    re.compile(r'(?:bhejo|send|transfer)\s+(\w+)', re.IGNORECASE),
]

# Purpose extraction
PURPOSE_PATTERNS = [
    re.compile(r'(?:ke liye|for)\s+(.+?)(?:\.|$)', re.IGNORECASE),
    re.compile(r'(?:khareedne|kharidne)\s+(.+?)(?:\.|$)', re.IGNORECASE),
]


def transcribe_audio_assemblyai(audio_file_path: str) -> str:
    try:
        assemblyai_key = os.getenv("ASSEMBLYAI_API_KEY")
        if not assemblyai_key:
            print("⚠️ ASSEMBLYAI_API_KEY not found, using demo transcription")
            return ""
        
        base_url = "https://api.assemblyai.com"
        headers = {"authorization": assemblyai_key}
        session = requests.Session()
        session.headers.update(headers)
        
        # ─── Step 1: Upload audio file ───
        print("📤 Uploading audio to AssemblyAI...")
        with open(audio_file_path, "rb") as f:
            response = session.post(base_url + "/v2/upload", data=f)
        response.raise_for_status()
        audio_url = response.json().get("upload_url")
        print(f"✅ Upload complete: {audio_url}")
        
        # ─── Step 2: Submit transcription request ───
        print("📝 Submitting transcription request...")
        data = {
            "audio_url": audio_url,
            "language_detection": True,  # Auto-detect Hindi/English
            "speech_models": ["universal-3-pro", "universal-2"],
        }
        
        response = session.post(base_url + "/v2/transcript", json=data)
        response.raise_for_status()
        transcript_id = response.json().get("id")
        print(f"✅ Transcription ID: {transcript_id}")
        
        # ─── Step 3: Poll for completion ───
        print("⏳ Processing audio...")
        polling_endpoint = f"{base_url}/v2/transcript/{transcript_id}"
        max_wait_time = 300  # 5 min timeout
        start_time = time.time()
        sleep_time = 1
        max_sleep = 5
        
        while True:
            if time.time() - start_time > max_wait_time:
                raise TimeoutError("Transcription timed out after 5 minutes")
            
            response = session.get(polling_endpoint)
            response.raise_for_status()
            
            result = response.json()
            status = result.get("status")
            
            print(f"   Status: {status}...")
            
            if status == "completed":
                transcript_text = result.get("text", "").strip()
                print(f"✅ Transcription complete: {transcript_text}")
                return transcript_text
            
            elif status == "error":
                error_msg = result.get("error", "Unknown error")
                raise RuntimeError(f"🚨 Transcription failed: {error_msg}")
            
            # Exponential backoff
            time.sleep(sleep_time)
            sleep_time = min(sleep_time * 1.5, max_sleep)
    
    except Exception as e:
        print(f"❌ AssemblyAI transcription failed: {e}")
        return ""

def create_payment_tools():
    import google as genai

    return genai.protos.Tool(
        function_declarations=[
            genai.protos.FunctionDeclaration(
                name="send_money",
                description="Send money from user to a receiver via UPI",
                parameters=genai.protos.Schema(
                    type=genai.protos.Type.OBJECT,
                    properties={
                        "receiver_name": genai.protos.Schema(
                            type=genai.protos.Type.STRING,
                            description="Name of the person/merchant to send money to"
                        ),
                        "amount": genai.protos.Schema(
                            type=genai.protos.Type.NUMBER,
                            description="Amount in rupees to send"
                        ),
                        "purpose": genai.protos.Schema(
                            type=genai.protos.Type.STRING,
                            description="Purpose of payment (vegetables, food, etc.)"
                        ),
                    },
                    required=["receiver_name", "amount"]
                )
            ),
            genai.protos.FunctionDeclaration(
                name="check_balance",
                description="Check account balance",
                parameters=genai.protos.Schema(
                    type=genai.protos.Type.OBJECT,
                    properties={}
                )
            ),
            genai.protos.FunctionDeclaration(
                name="confirm_transaction",
                description="Confirm a pending transaction",
                parameters=genai.protos.Schema(
                    type=genai.protos.Type.OBJECT,
                    properties={
                        "transaction_id": genai.protos.Schema(
                            type=genai.protos.Type.INTEGER,
                            description="ID of transaction to confirm"
                        ),
                        "confirmation": genai.protos.Schema(
                            type=genai.protos.Type.STRING,
                            description="yes or no"
                        ),
                    },
                    required=["transaction_id", "confirmation"]
                )
            ),
        ]
    )

def execute_payment_tool(tool_name: str, tool_input: dict, db: Session, user_upi: str = "pranay@sbi") -> dict:
    """Execute payment tools - simulated for hackathon."""
    
    if tool_name == "send_money":
        receiver_name = tool_input.get("receiver_name")
        amount = tool_input.get("amount")
        purpose = tool_input.get("purpose", "Payment")
        
        # Find receiver in database
        receiver = db.query(User).filter(
            User.name.ilike(f"%{receiver_name}%")
        ).first()
        
        if not receiver:
            return {
                "status": "error",
                "message": f"🚨 {receiver_name} ka UPI ID database mein nahi mila. Available: {[u.name for u in db.query(User).all()]}"
            }
        
        trust_data = calculate_trust_score(db, receiver.upi_id)
        
        transaction = Transaction(
            amount=amount,
            sender_upi_id=user_upi,
            receiver_upi_id=receiver.upi_id,
            timestamp=datetime.now(timezone.utc),
            status="PENDING_CONFIRMATION"
        )
        db.add(transaction)
        db.commit()
        
        trust_badge = trust_data.get("badge", "🟡 VERIFY")
        
        return {
            "status": "pending_confirmation",
            "transaction_id": transaction.id,
            "receiver_name": receiver.name,
            "receiver_upi": receiver.upi_id,
            "amount": amount,
            "purpose": purpose,
            "trust_badge": trust_badge,
            "trust_score": trust_data.get("trust_score", 0),
            "message": f"✅ Payment ready: ₹{amount} {receiver.name} ko {trust_badge} badge ke saath",
            "requires_voice_confirmation": True
        }
    
    elif tool_name == "check_balance":
        # Simulated balance
        return {
            "status": "success",
            "balance": 10000,
            "currency": "INR",
            "message": "Aapka balance ₹10,000 hai"
        }
    
    elif tool_name == "confirm_transaction":
        transaction_id = tool_input.get("transaction_id")
        confirmation = tool_input.get("confirmation")
        
        transaction = db.query(Transaction).filter(
            Transaction.id == transaction_id
        ).first()
        
        if not transaction:
            return {
                "status": "error",
                "message": "Transaction nahi mila"
            }
        
        if confirmation.lower() == "yes":
            transaction.status = "SUCCESS"
            db.commit()
            
            # Generate success response
            return {
                "status": "success",
                "message": f"✅ ₹{transaction.amount} successfully bhej diye gaye {transaction.receiver_upi_id} ko!",
                "transaction_id": transaction_id,
                "amount": transaction.amount,
                "receiver": transaction.receiver_upi_id
            }
        else:
            transaction.status = "CANCELLED"
            db.commit()
            return {
                "status": "cancelled",
                "message": f"❌ Payment cancelled. Koi masla tha kya?"
            }

def process_voice_command_with_agent(transcribed_text: str, db: Session, user_upi: str = "pranay@sbi") -> dict:
    try:
        from google import genai
        from google.genai import types
        from config import settings

        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        tools = [
            types.Tool(function_declarations=[
                types.FunctionDeclaration(
                    name="send_money",
                    description="Send money from user to a receiver via UPI",
                    parameters=types.Schema(
                        type="OBJECT",
                        properties={
                            "receiver_name": types.Schema(type="STRING", description="Name of the person to send money to"),
                            "amount":        types.Schema(type="NUMBER",  description="Amount in rupees"),
                            "purpose":       types.Schema(type="STRING",  description="Purpose of payment"),
                        },
                        required=["receiver_name", "amount"]
                    )
                ),
                types.FunctionDeclaration(
                    name="check_balance",
                    description="Check account balance",
                    parameters=types.Schema(type="OBJECT", properties={})
                ),
                types.FunctionDeclaration(
                    name="confirm_transaction",
                    description="Confirm a pending transaction",
                    parameters=types.Schema(
                        type="OBJECT",
                        properties={
                            "transaction_id": types.Schema(type="INTEGER", description="ID of transaction to confirm"),
                            "confirmation":   types.Schema(type="STRING",  description="yes or no"),
                        },
                        required=["transaction_id", "confirmation"]
                    )
                ),
            ])
        ]

        system_prompt = """You are PaySafe AI Voice Assistant. You help users send money via UPI in India.

CRITICAL INSTRUCTION: Always extract names in English/romanized form, NEVER in Hindi script.

FLOW:
1. When user says "send X ko Y rupees" → IMMEDIATELY call send_money(X, Y) tool
2. This creates a PENDING_CONFIRMATION transaction and returns transaction_id
3. User then confirms separately using the transaction_id
4. User enters PIN to complete the payment

IMPORTANT:
- For send_money: Always call the tool when user asks to send money
- receiver_name: Romanize Hindi names to English (रमेश → Ramesh, विक्रम → Vikram)
- amount: Extract the rupee amount
- purpose: Optional purpose for payment
- DO call the tool - don't just ask for confirmation

Examples of when to call send_money:
- User: "विक्रम को 500 भेजो" → Call: send_money("Vikram", 500, "Payment")
- User: "राहुल को 1000" → Call: send_money("Rahul", 1000)
- User: "प्रिया को 300 खाने के लिए" → Call: send_money("Priya", 300, "food")

For balance checks:
- User: "balance check karo" → call check_balance()

IMPORTANT: Transliterate Hindi names to English:
- रमेश → Ramesh
- राहुल → Rahul
- प्रिया → Priya
- विक्रम → Vikram

Always respond with English names in tools, never with Hindi script."""

        print(f"🎤 User said: {transcribed_text}")

        response = client.models.generate_content(
            model="gemini-2.0-flash",         
            contents=transcribed_text,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                tools=tools,
            )
        )

        tool_results = []
        pending_payment = None
        transaction = None
        tool_calls_for_response = []

        # ─── Read function calls from new SDK response ───
        for part in response.candidates[0].content.parts:
            if part.function_call:
                tool_name  = part.function_call.name
                tool_input = dict(part.function_call.args)

                print(f"🔧 Extracted tool: {tool_name} | Input: {tool_input}")
                
                # For send_money: create transaction and ask for confirmation
                if tool_name == "send_money":
                    receiver_name = tool_input.get("receiver_name")
                    amount = tool_input.get("amount")
                    purpose = tool_input.get("purpose", "Payment")
                    
                    # Find receiver in database
                    receiver = db.query(User).filter(
                        User.name.ilike(f"%{receiver_name}%")
                    ).first()
                    
                    if receiver:
                        # Create transaction immediately
                        transaction = Transaction(
                            amount=amount,
                            sender_upi_id=user_upi,
                            receiver_upi_id=receiver.upi_id,
                            timestamp=datetime.now(timezone.utc),
                            status="PENDING_CONFIRMATION"
                        )
                        db.add(transaction)
                        db.commit()
                        print(f"✅ Transaction created: ID={transaction.id}")
                        
                        pending_payment = {
                            "receiver_name": receiver_name,
                            "amount": amount,
                            "purpose": purpose,
                            "receiver_upi": receiver.upi_id,
                            "transaction_id": transaction.id
                        }
                    else:
                        # Receiver not found
                        available_users = [u.name for u in db.query(User).all()]
                        pending_payment = {
                            "receiver_name": receiver_name,
                            "amount": amount,
                            "purpose": purpose,
                            "error": f"❌ {receiver_name} database mein nahi mila. Available: {available_users}",
                            "transaction_id": None
                        }
                    
                    tool_results.append({
                        "tool": tool_name,
                        "input": tool_input,
                        "status": "pending_confirmation",
                        "transaction_id": transaction.id if transaction else None
                    })
                    print(f"✋ Payment pending confirmation: {pending_payment}")
                else:
                    # For other tools (check_balance, confirm_transaction), execute immediately
                    result = execute_payment_tool(tool_name, tool_input, db, user_upi)
                    tool_results.append({"tool": tool_name, "input": tool_input, "result": result})
                    tool_calls_for_response.append({
                        "tool_name": tool_name,
                        "tool_input": tool_input,
                        "tool_result": result
                    })

        text_parts = [
            p.text for p in response.candidates[0].content.parts
            if hasattr(p, "text") and p.text
        ]

        # If there's a pending payment, generate confirmation message
        if pending_payment:
            try:
                confirm_prompt = f"""Generate ONE single, natural Hindi/Hinglish message asking the user to confirm payment. Must be suitable for text-to-speech.

Receiver: {pending_payment['receiver_name']}
Amount: ₹{pending_payment['amount']}
Purpose: {pending_payment['purpose']}

REQUIREMENTS:
- ONLY ONE sentence, no bullet points, no lists, no markdown
- Ask user to confirm the payment
- Keep it SHORT (under 12 words)
- Suitable for voice TTS output
- NO special characters or formatting
- Be friendly and conversational

Good examples:
Vikram ko 500 rupaye bhejne hain kya?
Confirm karo, Rahul ke naam 1000 rupaye transfer
Priya ko 300 rupaye? Haan boldo"""

                confirm_response = client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=confirm_prompt,
                    config=types.GenerateContentConfig(
                        system_instruction="You are a friendly payment assistant. Always respond with EXACTLY ONE sentence, no lists, no bullet points, no markdown formatting."
                    )
                )
                
                confirmation_message = confirm_response.text.strip() if confirm_response.text else f"Confirm karo: {pending_payment['receiver_name']} ko {pending_payment['amount']} rupaye?"
            except Exception as e:
                print(f"⚠️ Confirmation message generation failed: {e}")
                confirmation_message = f"{pending_payment['receiver_name']} ko {pending_payment['amount']} rupaye? Confirm karo"
            
            return {
                "status": "pending_confirmation",
                "transcribed_text": transcribed_text,
                "pending_payment": pending_payment,
                "response": confirmation_message,
                "action_taken": True
            }
        
        # If tools were called (balance check, etc), ask LLM to generate human-friendly response
        human_response = " ".join(text_parts) if text_parts else ""
        
        if tool_calls_for_response:
            try:
                # Format tool results for LLM
                results_summary = "\n".join([
                    f"Tool: {t['tool_name']}\nResult: {json.dumps(t['tool_result'], ensure_ascii=False)}"
                    for t in tool_calls_for_response
                ])
                
                # Ask LLM to generate natural response
                followup_prompt = f"""Based on these tool execution results, respond in Hindi/Hinglish as a friendly payment assistant.

Tool Results:
{results_summary}

Generate a VERY SHORT natural response suitable for voice TTS. Examples:
- For check_balance: "Aapka balance 10 hazar rupaye hai"
- For confirm_transaction: "Payment successfully ho gaya" or "Payment cancel kar diya"

IMPORTANT: Be conversational and natural. No emojis."""

                followup_response = client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=followup_prompt,
                    config=types.GenerateContentConfig(
                        system_instruction="You are a friendly Hindi/Hinglish payment assistant. Respond naturally and conversationally."
                    )
                )
                
                human_response = followup_response.text.strip() if followup_response.text else human_response
            except Exception as e:
                print(f"⚠️ Followup response generation failed: {e}")
                human_response = human_response or json.dumps(tool_results, ensure_ascii=False)

        return {
            "status": "success",
            "transcribed_text": transcribed_text,
            "tool_calls": tool_results,
            "response": human_response,
            "action_taken": len(tool_results) > 0
        }

    except Exception as e:
        print(f"❌ Agent processing failed: {e}")
        return {"status": "error", "message": f"Voice command processing failed: {str(e)}"}

def process_voice_payment(audio_file_path: str, db: Session, user_upi: str = "pranay@sbi") -> dict:
    try:
        print(f"📞 Processing voice payment from {audio_file_path}")
        
        # Step 1: Transcribe audio using AssemblyAI
        print("🎤 Step 1: Transcribing audio...")
        transcribed_text = transcribe_audio_assemblyai(audio_file_path)
        
        if not transcribed_text:
            return {
                "status": "error",
                "message": "❌ Could not transcribe audio. Please check audio quality."
            }
        
        print(f"✅ Transcription: {transcribed_text}")
        
        # Step 2: Process with LLM Agent (function calling)
        print("🤖 Step 2: Processing with LLM agent...")
        agent_response = process_voice_command_with_agent(transcribed_text, db, user_upi)
        
        # Handle pending confirmation (send_money)
        if agent_response.get("status") == "pending_confirmation":
            # Generate TTS response
            response_text = agent_response.get("response", "")
            voice_url = None
            
            if response_text:
                try:
                    tts = gTTS(text=response_text, lang='hi')
                    filename = f"response_{int(time.time())}.mp3"
                    filepath = f"/tmp/{filename}"
                    tts.save(filepath)
                    voice_url = f"/audio/{filename}"
                    print(f"✅ Voice response generated: {filename}")
                except Exception as e:
                    print(f"⚠️ TTS generation failed: {e}")
            
            # Get sender info
            sender = db.query(User).filter(User.upi_id == user_upi).first()
            
            return {
                "status": "pending_confirmation",
                "transcribed_text": transcribed_text,
                "sender_upi": user_upi,
                "sender_name": sender.name if sender else "Unknown",
                "transaction_id": agent_response.get("pending_payment", {}).get("transaction_id"),
                "pending_payment": agent_response.get("pending_payment"),
                "response": agent_response.get("response"),
                "voice_response_url": voice_url,
                "message": f"✅ Payment ready. Please confirm."
            }
        
        if agent_response.get("status") != "success":
            return agent_response
        
        # Step 3: Extract response message for TTS
        print("🔊 Step 3: Generating voice response...")
        
        # Build response message from tool execution results
        tool_results = agent_response.get("tool_calls", [])
        
        if tool_results:
            # Get the last tool result message
            last_result = tool_results[-1]["result"]
            response_message = last_result.get("message", "Payment processing failed")
        else:
            response_message = agent_response.get("response", "No action taken")
        
        try:
            tts = gTTS(text=response_message, lang='hi')
            filename = f"response_{int(time.time())}.mp3"
            filepath = f"/tmp/{filename}"
            tts.save(filepath)
            voice_url = f"/audio/{filename}"
            print(f"✅ Voice response generated: {filename}")
        except Exception as e:
            print(f"⚠️ TTS generation failed: {e}")
            voice_url = None
        
        return {
            "status": "success",
            "transcribed_text": transcribed_text,
            "agent_response": agent_response,
            "voice_response_url": voice_url,
            "response_text": response_message,
            "message": "✅ Voice payment processed successfully"
        }
    
    except Exception as e:
        print(f"❌ Voice payment processing failed: {e}")
        return {
            "status": "error",
            "message": f"❌ Voice payment failed: {str(e)}"
        }
