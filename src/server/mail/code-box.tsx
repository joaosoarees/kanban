import { Text } from "react-email";
import { mailColors } from "@/server/mail/layout";

export function CodeBox({ code }: { code: string }) {
  return (
    <Text
      style={{
        margin: "4px 0 16px",
        padding: "14px 16px 14px 24px",
        border: `1px solid ${mailColors.border}`,
        borderRadius: 8,
        backgroundColor: mailColors.canvas,
        fontSize: 32,
        lineHeight: "40px",
        fontWeight: 700,
        letterSpacing: 8,
        fontVariantNumeric: "tabular-nums",
        color: mailColors.foreground,
        textAlign: "center",
      }}
    >
      {code}
    </Text>
  );
}
