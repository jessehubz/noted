import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="auth-page">
      <SignUp forceRedirectUrl="/auth-redirect" />
    </div>
  );
}
