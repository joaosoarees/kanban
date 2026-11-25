import { CodeBox } from "@/server/mail/code-box";
import { MailLayout, MailText } from "@/server/mail/layout";
import { renderMail } from "@/server/mail/render";

type VerifyEmailProps = { to: string; name: string; code: string };

export function VerifyEmail({ to, name, code }: VerifyEmailProps) {
  return (
    <MailLayout
      to={to}
      preview="Use o código para confirmar seu e-mail. Vale por 15 minutos."
      title="Confirme seu e-mail"
      note="Se você não criou uma conta, ignore este e-mail."
    >
      <MailText>
        Olá, {name}. Use este código para confirmar seu e-mail no Kanbanary:
      </MailText>
      <CodeBox code={code} />
      <MailText small>
        O código vale por 15 minutos. Se você pedir um código novo, este deixa
        de valer.
      </MailText>
    </MailLayout>
  );
}

export async function verifyEmailMail(props: VerifyEmailProps) {
  return renderMail(
    props.to,
    "Seu código de verificação do Kanbanary",
    <VerifyEmail {...props} />,
  );
}
