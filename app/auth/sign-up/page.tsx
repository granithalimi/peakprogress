import { SignUpForm } from "@/components/sign-up-form";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center bg-slate-50/50 p-4 sm:p-6 md:p-10">
      <div className="w-full max-w-sm sm:max-w-md">
        <SignUpForm />
      </div>
    </div>
  );
}
