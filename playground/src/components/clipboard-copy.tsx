import { Slot } from "@radix-ui/react-slot";
import {
  CopyCheckIcon as LucideCopyCheckIcon,
  CopyIcon as LucideCopyIcon,
  type LucideProps,
} from "lucide-react";
import { createContext, useContext, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { toast } from "sonner";

const ClipboardCopyContext = createContext({ copied: false });

interface ClipboardCopyProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  data: string;
}

export function ClipboardCopy({ asChild, data, ...props }: ClipboardCopyProps) {
  const Comp = asChild ? Slot : "button";
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const onClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    props.onClick?.(event);
    if (event.isDefaultPrevented()) {
      return;
    }

    flushSync(() => {
      setCopied(true);
    });

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => setCopied(false), 1_000);

    await navigator.clipboard.writeText(data);
    toast.info("Copied to clipboard.");
  };

  return (
    <ClipboardCopyContext.Provider value={{ copied }}>
      <Comp
        {...props}
        type={asChild ? props.type : "button"}
        onClick={onClick}
      />
    </ClipboardCopyContext.Provider>
  );
}

export function ClipboardCopyIcon(props: LucideProps) {
  const context = useContext(ClipboardCopyContext);
  const Icon = context.copied ? LucideCopyCheckIcon : LucideCopyIcon;

  return <Icon {...props} />;
}
