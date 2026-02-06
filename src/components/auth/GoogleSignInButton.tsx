import { useState } from "react";
import { Chrome } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { lovable } from "@/integrations/lovable";

export function GoogleSignInButton({ disabled }: { disabled?: boolean }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogle = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });

      if (error) {
        toast({
          title: "Google Login fehlgeschlagen",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      // Falls redirect passiert, wird die Seite ohnehin navigieren.
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={disabled || loading}
      onClick={handleGoogle}
    >
      <Chrome className="w-4 h-4" />
      {loading ? "Weiterleiten…" : "Mit Google fortfahren"}
    </Button>
  );
}
