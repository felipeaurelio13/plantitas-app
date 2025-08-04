# Security Guidelines

## 🔐 Secret Management

### Environment Variables
All sensitive configuration should be stored in environment variables:

```bash
# Required environment variables
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key

# Firebase configuration (if using Firebase)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Supabase Edge Functions
For Supabase Edge Functions, configure secrets in the Supabase dashboard:
- Go to Settings > API > Environment Variables
- Add `OPENAI_API_KEY` with your actual API key

## 🚫 What NOT to Do

- ❌ Never commit `.env` files with real secrets
- ❌ Never hardcode API keys in source code
- ❌ Never commit service account files
- ❌ Never commit private keys or certificates

## ✅ What TO Do

- ✅ Use `.env.example` for documentation
- ✅ Store secrets in environment variables
- ✅ Use Supabase dashboard for Edge Function secrets
- ✅ Use Firebase console for Firebase configuration
- ✅ Regularly rotate API keys
- ✅ Use least privilege principle for API keys

## 🔍 Security Scanning

This project includes:
- Input validation to detect sensitive data patterns
- Malicious input detection
- Token limit validation
- Rate limiting for API calls

## 🚨 Incident Response

If you discover a secret has been committed:

1. **Immediate Actions:**
   - Revoke the exposed secret immediately
   - Generate a new secret
   - Update all environments with the new secret

2. **Clean Up:**
   - Remove the secret from git history
   - Update any documentation that referenced the old secret

3. **Prevention:**
   - Review git hooks and CI/CD pipelines
   - Implement pre-commit hooks for secret detection
   - Regular security audits

## 📞 Reporting Security Issues

If you find a security vulnerability:
1. **DO NOT** create a public issue
2. Contact the maintainers privately
3. Provide detailed information about the vulnerability
4. Allow time for assessment and remediation