// Tipos mínimos pros SDKs carregados via <script> (Google Identity Services, Sign in with
// Apple JS) — nenhum dos dois publica pacote oficial de tipos, e não vale a pena adicionar
// uma dependência não-oficial só por isso.

interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
}

interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  itp_support?: boolean;
}

interface GoogleButtonConfiguration {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: number;
}

interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: GoogleIdConfiguration) => void;
        renderButton: (parent: HTMLElement, options: GoogleButtonConfiguration) => void;
        prompt: () => void;
      };
    };
  };
  AppleID?: {
    auth: {
      init: (config: {
        clientId: string;
        scope: string;
        redirectURI: string;
        usePopup: boolean;
      }) => void;
      signIn: () => Promise<{
        authorization: { id_token: string; code: string; state?: string };
        user?: { name?: { firstName?: string; lastName?: string }; email?: string };
      }>;
    };
  };
}
