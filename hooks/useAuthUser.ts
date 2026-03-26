"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";

import { getCurrentUser, observeAuthState } from "@/lib/firebase/client";

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(getCurrentUser());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = observeAuthState((nextUser) => {
      setUser(nextUser);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return { user, isLoading };
}
