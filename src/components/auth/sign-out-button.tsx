import { signOutAction } from "@/app/auth/actions";
import { SignOutSubmitButton } from "@/components/auth/sign-out-submit-button.tsx";

export function SignOutButton() {
  return (
    <form
      action={signOutAction}
      className="w-full"
    >
      <SignOutSubmitButton />
    </form>
  );
}