import { Button, Link } from "react-email";
import { mailColors, MailLayout, MailText } from "@/server/mail/layout";
import { renderMail } from "@/server/mail/render";

type InviteProps = {
  to: string;
  inviterName: string;
  workspaceName: string;
  link: string;
};

export function Invite({ to, inviterName, workspaceName, link }: InviteProps) {
  return (
    <MailLayout
      to={to}
      preview={`${inviterName} convidou você para o workspace ${workspaceName}.`}
      title={`Convite para ${workspaceName}`}
      note="Se você não esperava este convite, ignore este e-mail. Ninguém entra no workspace sem aceitar."
    >
      <MailText>
        {inviterName} convidou você para o workspace {workspaceName} no
        Kanbanary.
      </MailText>
      <Button
        href={link}
        style={{
          display: "inline-block",
          margin: "4px 0 20px",
          padding: "12px 20px",
          borderRadius: 8,
          backgroundColor: mailColors.brand,
          color: mailColors.onColor,
          fontSize: 15,
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        Ver convite
      </Button>
      <MailText small>
        Se o botão não abrir, copie este endereço no navegador:
        <br />
        <Link
          href={link}
          style={{ color: mailColors.brand, wordBreak: "break-all" }}
        >
          {link}
        </Link>
      </MailText>
      <MailText small>
        O convite vale por 7 dias e só para este e-mail. Se você ainda não tem
        conta, pode criar uma pelo link.
      </MailText>
    </MailLayout>
  );
}

export async function inviteMail(props: InviteProps) {
  return renderMail(
    props.to,
    `${props.inviterName} convidou você para ${props.workspaceName}`,
    <Invite {...props} />,
  );
}
