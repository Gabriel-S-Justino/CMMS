// src/view/login/termo_e_privacidade/termos.tsx
import { LegalDocumentScreen } from "@/components/legal-document-screen";

export default function TermosScreen() {
  return (
    <LegalDocumentScreen
      title="Termos de Uso"
      lastUpdated="[DATA]"
      sections={[
        {
          title: "1. Aceitação dos Termos",
          paragraphs: [
            "Ao acessar e utilizar o sistema CMMS, você concorda em cumprir e ficar vinculado aos termos e condições descritos neste documento.",
          ],
        },
        {
          title: "2. Uso do Sistema",
          paragraphs: [
            "O sistema destina-se ao controle e monitoramento de manutenções de equipamentos, sendo de uso restrito aos usuários autorizados pela organização.",
          ],
        },
        {
          title: "3. Responsabilidades do Usuário",
          paragraphs: [
            "O usuário é responsável pela veracidade das informações registradas no sistema, incluindo dados de manutenção, custos e prestadores de serviço.",
          ],
        },
      ]}
    />
  );
}