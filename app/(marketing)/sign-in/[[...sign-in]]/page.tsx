import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center py-16">
      <SignIn
        fallbackRedirectUrl="/dashboard"
        appearance={{
          variables: {
            colorPrimary: "#6366f1",
            colorBackground: "#ffffff",
            colorInputBackground: "#f8fafc",
            colorInputText: "#1e293b",
            colorText: "#1e293b",
            colorTextSecondary: "#64748b",
            colorNeutral: "#cbd5e1",
            borderRadius: "0.75rem",
          },
          elements: {
            card: "shadow-2xl",
            formButtonPrimary: "bg-indigo-500 hover:bg-indigo-600",
          },
        }}
      />
    </div>
  );
}
