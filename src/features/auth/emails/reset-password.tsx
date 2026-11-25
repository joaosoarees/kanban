import { CodeBox } from "@/server/mail/code-box";
import { MailLayout, MailText } from "@/server/mail/layout";
import { renderMail } from "@/server/mail/render";

type ResetPasswordProps = { to: string; name: string; code: string };

export function ResetPassword({ to, name, code }: ResetPasswordProps) {
  return (
    <MailLayout
      to={to}
      preview="Use o código para criar uma senha nova. Vale por 15 minutos."
      title="Redefina sua senha"
      note="Se você não pediu para redefinir a senha, ignore este e-mail. Sua senha continua a mesma."
    >
      <MailText>
        Olá, {name}. Use este código para criar uma senha nova no Kanbanary:
      </MailText>
      <CodeBox code={code} />
      <MailText small>
        O código vale por 15 minutos. Se você pedir um código novo, este deixa
        de valer.
      </MailText>
    </MailLayout>
  );
}

export async function resetPasswordMail(props: ResetPasswordProps) {
  return renderMail(
    props.to,
    "Seu código para redefinir a senha do Kanbanary",
    <ResetPassword {...props} />,
  );
}
