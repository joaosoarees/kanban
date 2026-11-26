import { RotateCcw } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  linkButton,
  primaryButton,
  textLink,
} from "@/components/button-styles";
import { Button } from "@/components/ui/button";
import { InviteButton } from "@/features/members/components/invite-button";
import type { InvitePreview } from "@/features/members/server/invite-acceptance";
import { WorkspaceTile } from "@/features/workspaces/components/workspace-tile";
import { cn } from "@/lib/utils";

const validUntil = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "America/Sao_Paulo",
});

function Strong({ children }: { children: ReactNode }) {
  return <strong className="font-medium text-foreground">{children}</strong>;
}

function Lead({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm/[22px] wrap-anywhere text-muted-foreground">
      {children}
    </p>
  );
}

function InviteHeading({
  invite,
  children,
}: {
  invite?: InvitePreview;
  children: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-2">
      {invite && (
        <WorkspaceTile
          name={invite.workspaceName}
          slug={invite.workspaceSlug}
          className="mb-2 size-10 rounded-[10px] text-[15px]"
        />
      )}
      <h1 className="text-2xl font-semibold tracking-tight text-balance wrap-anywhere">
        {invite ? invite.workspaceName : "Este convite é para outro e-mail"}
      </h1>
      {children}
    </div>
  );
}

function InvitedBy({ invite }: { invite: InvitePreview }) {
  return (
    <Lead>
      <Strong>{invite.inviterName}</Strong> convidou você para participar como{" "}
      {invite.role === "ADMIN" ? "admin" : "membro"}.
    </Lead>
  );
}

function Footnote({ children }: { children: ReactNode }) {
  return (
    <p className="text-center text-sm text-muted-foreground">{children}</p>
  );
}

export function InviteForGuest({
  token,
  invite,
  onGone,
}: {
  token: string;
  invite: InvitePreview;
  onGone: () => void;
}) {
  return (
    <>
      <InviteHeading invite={invite}>
        <InvitedBy invite={invite} />
        <Lead>
          O convite é para <Strong>{invite.email}</Strong> e vale até{" "}
          {validUntil.format(invite.expiresAt)}.
        </Lead>
      </InviteHeading>
      <div className="flex flex-col gap-3">
        <InviteButton
          token={token}
          onGone={onGone}
          intent="sign-up"
          pendingLabel="Abrindo…"
        >
          Criar conta
        </InviteButton>
        <InviteButton
          token={token}
          onGone={onGone}
          intent="sign-in"
          variant="outline"
          pendingLabel="Abrindo…"
        >
          Entrar
        </InviteButton>
      </div>
      <div className="mt-5">
        <Footnote>Você cria a conta ou entra com o e-mail do convite.</Footnote>
      </div>
    </>
  );
}

export function InviteForMember({
  token,
  invite,
  onGone,
}: {
  token: string;
  invite: InvitePreview;
  onGone: () => void;
}) {
  return (
    <>
      <InviteHeading invite={invite}>
        <InvitedBy invite={invite} />
        <Lead>
          Você está conectado como <Strong>{invite.email}</Strong>.
        </Lead>
      </InviteHeading>
      <InviteButton
        token={token}
        onGone={onGone}
        intent="accept"
        pendingLabel="Entrando…"
      >
        Aceitar convite
      </InviteButton>
      <div className="mt-5">
        <Footnote>
          <Link href="/" className={textLink}>
            Agora não
          </Link>
        </Footnote>
      </div>
    </>
  );
}

export function InviteForOtherAccount({
  token,
  invite,
  email,
  onGone,
}: {
  token: string;
  invite: InvitePreview;
  email: string;
  onGone: () => void;
}) {
  return (
    <>
      <InviteHeading>
        <Lead>
          <Strong>{invite.inviterName}</Strong> convidou{" "}
          <Strong>{invite.email}</Strong> para{" "}
          <Strong>{invite.workspaceName}</Strong>.
        </Lead>
        <Lead>
          Você está conectado como <Strong>{email}</Strong>.
        </Lead>
      </InviteHeading>
      <InviteButton
        token={token}
        onGone={onGone}
        intent="sign-in"
        pendingLabel="Saindo…"
      >
        Trocar de conta
      </InviteButton>
      <div className="mt-5">
        <Footnote>
          <Link href="/" className={textLink}>
            Voltar ao início
          </Link>
        </Footnote>
      </div>
    </>
  );
}

export function InviteGone({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <>
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          Este convite não vale mais
        </h1>
        <Lead>
          Peça um novo a quem convidou. O convite vence em 7 dias e pode ter
          sido revogado ou já usado.
        </Lead>
      </div>
      {isSignedIn ? (
        <Link href="/" className={linkButton("default", "h-10 w-full")}>
          Ir para o início
        </Link>
      ) : (
        <>
          <Link
            href="/sign-in"
            className={linkButton("default", "h-10 w-full")}
          >
            Entrar
          </Link>
          <div className="mt-5">
            <Footnote>
              Não tem conta?{" "}
              <Link href="/sign-up" className={textLink}>
                Crie a sua
              </Link>
            </Footnote>
          </div>
        </>
      )}
    </>
  );
}

export function InviteLoadFailed({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          Não foi possível carregar o convite
        </h1>
        <Lead>
          Confira a sua conexão e tente de novo. Se continuar, abra outra vez o
          link do e-mail do convite.
        </Lead>
      </div>
      <Button
        type="button"
        onClick={onRetry}
        className={cn("h-10 w-full", primaryButton)}
      >
        <RotateCcw aria-hidden="true" />
        Tentar de novo
      </Button>
    </div>
  );
}
