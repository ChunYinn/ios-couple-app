import { createContext, ReactNode, useContext, useState } from "react";

type SignupDraft = {
  email: string;
  password: string;
  confirm: string;
};

const defaultDraft: SignupDraft = {
  email: "",
  password: "",
  confirm: "",
};

const SignupContext = createContext<{
  draft: SignupDraft;
  setDraft: (draft: SignupDraft) => void;
  resetDraft: () => void;
} | null>(null);

export const SignupProvider = ({ children }: { children: ReactNode }) => {
  const [draft, setDraftState] = useState<SignupDraft>(defaultDraft);

  const setDraft = (next: SignupDraft) => setDraftState(next);
  const resetDraft = () => setDraftState(defaultDraft);

  return (
    <SignupContext.Provider value={{ draft, setDraft, resetDraft }}>
      {children}
    </SignupContext.Provider>
  );
};

export const useSignupDraft = () => {
  const ctx = useContext(SignupContext);
  if (!ctx) throw new Error("useSignupDraft must be used within SignupProvider");
  return ctx;
};
