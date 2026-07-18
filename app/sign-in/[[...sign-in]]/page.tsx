import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="auth-page">
      <SignIn forceRedirectUrl="/api/auth-redirect" />
    </div>
  );
}
