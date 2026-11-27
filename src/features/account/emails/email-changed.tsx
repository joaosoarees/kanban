import { MailLayout, MailText } from "@/server/mail/layout";
import { renderMail } from "@/server/mail/render";

type EmailChangedProps = {
  to: string;
  name: string;
  newEmail: string;
  changedAt: Date;
};

const day = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "America/Sao_Paulo",
});

const time = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

export function EmailChanged({
  to,
  name,
  newEmail,
  changedAt,
}: EmailChangedProps) {
  const at = `${day.format(changedAt)} às ${time.format(changedAt).replace(":", "h")}`;
  return (
    <MailLayout
      to={to}
      preview={`O e-mail da sua conta mudou para ${newEmail}.`}
      title="O e-mail da sua conta mudou"
      note="Este aviso vai para o endereço antigo, que deixou de ser usado para entrar."
    >
      <MailText>
        Olá, {name}. O e-mail da sua conta no Kanbanary mudou em {at} para:
      </MailText>
      <MailText>
        <strong>{newEmail}</strong>
      </MailText>
      <MailText small>
        Se não foi você, abra o Kanbanary num aparelho em que você ainda esteja
        conectado, troque a senha e o e-mail em Conta e avise quem administra o
        seu workspace.
      </MailText>
    </MailLayout>
  );
}

export async function emailChangedMail(props: EmailChangedProps) {
  return renderMail(
    props.to,
    "O e-mail da sua conta no Kanbanary mudou",
    <EmailChanged {...props} />,
  );
}
