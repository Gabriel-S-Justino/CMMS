// src/view/login/termo_e_privacidade/privacidade.tsx
import { LegalDocumentScreen } from "@/components/legal-document-screen";

export default function PrivacidadeScreen() {
  return (
    <LegalDocumentScreen
      title="Política de Privacidade"
      lastUpdated="[DATA]"
      sections={[
        {
          title: "1. Dados Coletados",
          paragraphs: [
            "Coletamos informações de cadastro de equipamentos, prestadores de serviço, manutenções e custos inseridos pelos usuários autorizados do sistema.",
          ],
        },
        {
          title: "2. Uso das Informações",
          paragraphs: [
            "Os dados são utilizados exclusivamente para viabilizar o controle de manutenções, geração de relatórios e indicadores dentro da organização.",
          ],
        },
        {
          title: "3. Compartilhamento de Dados",
          paragraphs: [
            "As informações não são compartilhadas com terceiros, exceto quando exigido por obrigação legal ou regulatória.",
          ],
        },
      ]}
    />
  );
}