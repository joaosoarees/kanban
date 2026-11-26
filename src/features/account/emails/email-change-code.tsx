import { CodeBox } from "@/server/mail/code-box";
import { MailLayout, MailText } from "@/server/mail/layout";
import { renderMail } from "@/server/mail/render";

type EmailChangeCodeProps = { to: string; name: string; code: string };

export function EmailChangeCode({ to, name, code }: EmailChangeCodeProps) {
  return (
    <MailLayout
      to={to}
      preview="Use o código para confirmar seu novo e-mail. Vale por 15 minutos."
      title="Confirme seu novo e-mail"
      note="Se você não pediu essa troca, ignore este e-mail. O e-mail da conta não muda sem o código."
    >
      <MailText>
        Olá, {name}. Use este código para confirmar seu novo e-mail no
        Kanbanary:
      </MailText>
      <CodeBox code={code} />
      <MailText small>
        O código vale por 15 minutos. Se você pedir um código novo, este deixa
        de valer.
      </MailText>
    </MailLayout>
  );
}

export async function emailChangeCodeMail(props: EmailChangeCodeProps) {
  return renderMail(
    props.to,
    "Seu código para trocar o e-mail do Kanbanary",
    <EmailChangeCode {...props} />,
  );
}
