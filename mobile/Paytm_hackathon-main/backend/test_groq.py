import os
import asyncio
import json
from dotenv import load_dotenv
from services.ai_insights_service import generate_ai_insights

async def test():
    print("🚀 Testing Groq Integration...")
    load_dotenv()
    
    mock_stats = {
        "today": {"revenue": 1500.50, "count": 12},
        "yesterday": {"revenue": 1200.00, "count": 10},
        "this_week": {"revenue": 8500.00, "count": 75},
        "last_week": {"revenue": 9000.00, "count": 80},
        "this_month": {"revenue": 35000.00, "count": 300},
        "last_month": {"revenue": 32000.00, "count": 280},
    }
    
    merchant_name = "DreamTech Hackathon Store"
    
    try:
        result = await generate_ai_insights(merchant_name, mock_stats)
        print("\n📊 AI Insights Result:")
        print(json.dumps(result, indent=2))
        
        if result.get("source") == "groq_ai" and "forecast_data" in result:
            print("\n✅ SUCCESS: Detailed Insights generated using Groq!")
            print(f"Forecast for next 7 days: {result['forecast_data']}")
        elif result.get("source") == "rule_based_fallback":
            print("\n⚠️ WARNING: Applied rule-based fallback. Check GROQ_API_KEY or connection.")
        else:
            print("\n❌ FAILED: Unexpected source or missing forecast data:", result.get("source"))
            
    except Exception as e:
        print(f"\n❌ ERROR during test: {e}")

if __name__ == "__main__":
    asyncio.run(test())
