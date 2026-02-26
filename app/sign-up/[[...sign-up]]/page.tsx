import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center py-16">
      <SignUp
        appearance={{
          variables: {
            colorPrimary: "#6366f1",
            colorBackground: "#1e293b",
            colorInputBackground: "#0f172a",
            colorInputText: "#f1f5f9",
            colorText: "#f1f5f9",
            colorTextSecondary: "#94a3b8",
            colorNeutral: "#334155",
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
