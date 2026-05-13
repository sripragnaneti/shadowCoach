import os
import sys
from dotenv import load_dotenv
from anthropic import Anthropic, APIError

def verify_connection():
    print("🔍 Testing backend configuration...")
    load_dotenv()
    
    api_key = os.getenv("ANTHROPIC_API_KEY")
    
    if not api_key or "REPLACE" in api_key:
        print("❌ FAILED: No API Key detected in .env file.")
        return
        
    if "abcdef" in api_key:
        print(f"⚠️  WARNING: The key starting with '{api_key[:10]}' appears to be a common online tutorial placeholder.")
        
    print("📡 Connecting to Anthropic API servers...")
    client = Anthropic(api_key=api_key)
    
    try:
        # Attempt a tiny, cheap 1-token message to verify auth
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1,
            messages=[{"role": "user", "content": "Hi"}]
        )
        print("✅ SUCCESS! The API Key is active and fully authenticated.")
        
    except APIError as e:
        print("\n❌ API CALL FAILED.")
        print(f"   Error Type: {type(e).__name__}")
        print(f"   Server Response: {str(e)}")
        print("\n💡 Hint: Ensure your key starts with 'sk-ant-', has no extra spaces, and your account has credits.")
    except Exception as ex:
        print(f"\n⚠️  Unexpected System Error: {ex}")

if __name__ == "__main__":
    verify_connection()
