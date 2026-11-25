import { MailLayout, MailText } from "@/server/mail/layout";
import { renderMail } from "@/server/mail/render";

type SignUpAttemptProps = { to: string; name: string };

export function SignUpAttempt({ to, name }: SignUpAttemptProps) {
  return (
    <MailLayout
      to={to}
      preview="Sua conta continua igual. Veja o que fazer se não foi você."
      title="Alguém tentou criar uma conta com este e-mail"
      note="Se não foi você, não precisa fazer nada. Ninguém entrou na sua conta."
    >
      <MailText>
        Olá, {name}. Alguém tentou criar uma conta no Kanbanary com este
        endereço. Ele já tem uma conta, então nada foi criado e a sua conta
        continua igual.
      </MailText>
      <MailText>
        Se foi você, entre com sua senha. Se esqueceu a senha, use “Esqueci a
        senha” na tela de entrada.
      </MailText>
    </MailLayout>
  );
}

export async function signUpAttemptMail(props: SignUpAttemptProps) {
  return renderMail(
    props.to,
    "Tentativa de cadastro com seu e-mail",
    <SignUpAttempt {...props} />,
  );
}
