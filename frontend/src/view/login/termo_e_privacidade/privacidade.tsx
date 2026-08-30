// src/view/login/termo_e_privacidade/privacidade.tsx
import { LegalDocumentScreen } from "@/components/legal-document-screen";

export default function PrivacidadeScreen() {
  return (
    <LegalDocumentScreen
      title="Política de Privacidade"
      lastUpdated="29/08/2026"
      sections={[
        {
          title: "1. Dados Pessoais Coletados",
          paragraphs: [
            "O sistema CMMS poderá realizar o tratamento de dados pessoais necessários à disponibilização, segurança e funcionamento da plataforma, observados os princípios e requisitos estabelecidos pela Lei nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais – LGPD).",
            "Entre os dados que poderão ser tratados estão informações de identificação e cadastro dos usuários, como nome, endereço de e-mail, informações relacionadas à função ou setor, credenciais de acesso e registros necessários à autenticação e segurança da conta.",
            "Também poderão ser registrados dados relacionados à utilização do sistema, como registros de acesso, data e horário de acesso, ações realizadas, alterações efetuadas, endereço IP e informações técnicas necessárias à segurança, auditoria e funcionamento da plataforma.",
            "Além dos dados pessoais dos usuários, o sistema poderá armazenar informações operacionais inseridas pelos usuários autorizados, incluindo dados de equipamentos, ativos, manutenções, ordens de serviço, custos, fornecedores, prestadores de serviço e demais informações relacionadas às atividades da organização.",
            "O tratamento de dados pessoais será limitado ao que for necessário, adequado e pertinente às finalidades informadas nesta Política de Privacidade.",
          ],
        },

        {
          title: "2. Finalidades do Tratamento",
          paragraphs: [
            "Os dados pessoais são tratados para permitir o cadastro, autenticação, gerenciamento de contas e controle de acesso dos usuários ao sistema CMMS.",
            "As informações também poderão ser utilizadas para viabilizar o controle, planejamento, acompanhamento e monitoramento das atividades de manutenção de equipamentos e ativos da organização.",
            "Os dados poderão ser tratados para geração de relatórios, indicadores, históricos de manutenção, registros operacionais, auditorias e demais funcionalidades necessárias ao funcionamento do sistema.",
            "Também poderão ser utilizados para garantir a segurança da plataforma, prevenir fraudes, identificar acessos indevidos, investigar incidentes de segurança e preservar a integridade das informações.",
            "Quando necessário, os dados poderão ser tratados para cumprimento de obrigações legais ou regulatórias, exercício regular de direitos e atendimento de determinações de autoridades competentes.",
          ],
        },

        {
          title: "3. Bases Legais",
          paragraphs: [
            "O tratamento de dados pessoais realizado pelo sistema deverá estar fundamentado em uma das bases legais previstas na Lei nº 13.709/2018 (LGPD), conforme a natureza e a finalidade de cada tratamento.",
            "Quando aplicável, poderão ser utilizadas bases legais como o cumprimento de obrigação legal ou regulatória, a execução de contrato ou de procedimentos preliminares relacionados a contrato, o exercício regular de direitos, a proteção do crédito, o legítimo interesse do controlador ou o consentimento do titular.",
            "A base legal aplicável poderá variar de acordo com o tipo de dado tratado, a finalidade do tratamento e as circunstâncias específicas de cada operação.",
          ],
        },

        {
          title: "4. Compartilhamento de Dados",
          paragraphs: [
            "Os dados pessoais poderão ser compartilhados somente quando necessário para o cumprimento das finalidades descritas nesta Política de Privacidade, para a execução das atividades da organização, para prestação de serviços relacionados ao funcionamento do sistema ou nas hipóteses permitidas pela legislação aplicável.",
            "Quando utilizados fornecedores ou prestadores de serviços que realizem operações envolvendo dados pessoais em nome do responsável pelo tratamento, estes deverão observar as obrigações de segurança, confidencialidade e proteção de dados aplicáveis à relação.",
            "Os dados também poderão ser compartilhados quando necessário para o cumprimento de obrigação legal ou regulatória, atendimento de determinação de autoridade competente ou exercício regular de direitos.",
            "Não será realizado compartilhamento de dados pessoais para finalidades incompatíveis com aquelas informadas nesta Política de Privacidade.",
          ],
        },

        {
          title: "5. Segurança das Informações",
          paragraphs: [
            "Serão adotadas medidas técnicas e administrativas apropriadas para proteger os dados pessoais contra acessos não autorizados e situações acidentais ou ilícitas de destruição, perda, alteração, comunicação ou qualquer forma de tratamento inadequado ou ilícito.",
            "As medidas de segurança deverão considerar a natureza dos dados tratados, as finalidades do tratamento, os riscos envolvidos e as características da infraestrutura utilizada pelo sistema.",
            "O acesso às informações deverá ser limitado aos usuários autorizados e de acordo com as respectivas permissões e necessidades relacionadas às suas atividades.",
            "Apesar da adoção de medidas de segurança, nenhum sistema de informação pode garantir segurança absoluta. Na ocorrência de incidente de segurança envolvendo dados pessoais e que possa acarretar risco ou dano relevante aos titulares, serão adotadas as providências previstas na legislação e na regulamentação aplicável.",
          ],
        },

        {
          title: "6. Armazenamento e Retenção dos Dados",
          paragraphs: [
            "Os dados pessoais serão armazenados pelo período necessário para cumprir as finalidades para as quais foram coletados, atender às obrigações legais ou regulatórias aplicáveis, possibilitar o exercício regular de direitos e preservar registros necessários à segurança e à auditoria do sistema.",
            "Após o término da finalidade do tratamento, os dados poderão ser eliminados, anonimizados ou mantidos pelo período necessário quando houver fundamento legal que justifique sua conservação.",
            "Os períodos de retenção poderão variar de acordo com a natureza do dado, a finalidade do tratamento e as obrigações legais ou regulatórias aplicáveis.",
          ],
        },

        {
          title: "7. Direitos dos Titulares",
          paragraphs: [
            "Nos termos da LGPD, o titular dos dados pessoais possui direitos relacionados ao tratamento de seus dados, incluindo a confirmação da existência de tratamento, o acesso aos dados, a correção de dados incompletos, inexatos ou desatualizados e, quando aplicável, a anonimização, bloqueio ou eliminação de dados tratados em desconformidade com a legislação.",
            "O titular também poderá solicitar informações sobre o compartilhamento de seus dados, bem como exercer outros direitos previstos na legislação, observadas as hipóteses e limitações estabelecidas pela LGPD.",
            "Quando o tratamento estiver fundamentado no consentimento, o titular poderá solicitar sua revogação mediante procedimento gratuito e facilitado, ressalvadas as hipóteses em que a manutenção do tratamento seja autorizada ou exigida pela legislação.",
            "As solicitações relacionadas aos direitos dos titulares deverão ser encaminhadas por meio do canal de atendimento disponibilizado pelo responsável pelo tratamento dos dados.",
          ],
        },

        {
          title: "8. Confidencialidade e Acesso",
          paragraphs: [
            "O acesso aos dados armazenados no CMMS será controlado de acordo com as permissões atribuídas a cada usuário.",
            "Os usuários autorizados deverão manter a confidencialidade das informações às quais tenham acesso por meio do sistema e não poderão utilizar, copiar, divulgar ou compartilhar dados para finalidades não autorizadas.",
            "As credenciais de acesso são pessoais e intransferíveis, cabendo ao usuário protegê-las contra utilização indevida.",
          ],
        },

        {
          title: "9. Incidentes de Segurança",
          paragraphs: [
            "Em caso de incidente de segurança que envolva dados pessoais, serão adotadas medidas para identificar, avaliar, conter e mitigar os possíveis impactos aos titulares.",
            "Quando o incidente atender aos critérios estabelecidos pela legislação e pela regulamentação da Autoridade Nacional de Proteção de Dados (ANPD), serão realizadas as comunicações e demais providências legalmente exigidas.",
            "Os incidentes serão avaliados individualmente considerando sua natureza, os dados envolvidos, os possíveis riscos e danos aos titulares e as medidas adotadas para mitigação.",
          ],
        },

        {
          title: "10. Controlador e Encarregado",
          paragraphs: [
            "A organização responsável pelas decisões referentes ao tratamento dos dados pessoais no âmbito do CMMS será considerada controladora dos dados, quando aplicável, nos termos da LGPD.",
            "Quando houver terceiros realizando tratamento de dados pessoais em nome da organização, estes poderão atuar como operadores, conforme a relação estabelecida entre as partes.",
            "O canal de contato do responsável pelo tratamento e, quando aplicável, do encarregado pelo tratamento de dados pessoais deverá ser disponibilizado de forma clara e acessível aos titulares.",
          ],
        },

        {
          title: "11. Alterações desta Política",
          paragraphs: [
            "Esta Política de Privacidade poderá ser atualizada sempre que necessário para refletir alterações no sistema, nas operações de tratamento, na legislação ou nas orientações e regulamentações da Autoridade Nacional de Proteção de Dados (ANPD).",
            "A versão vigente da Política de Privacidade estará disponível para consulta no sistema.",
            "Quando houver alterações relevantes que possam impactar os direitos ou as expectativas dos titulares, serão adotadas medidas de comunicação compatíveis com a natureza da alteração.",
          ],
        },

        {
          title: "12. Legislação Aplicável",
          paragraphs: [
            "Esta Política de Privacidade será interpretada de acordo com a legislação brasileira aplicável à proteção de dados pessoais, especialmente a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais – LGPD), sem prejuízo de outras normas aplicáveis ao tratamento realizado pela organização.",
            "As disposições desta Política deverão ser interpretadas em conjunto com os demais documentos, políticas e procedimentos relacionados à segurança da informação, privacidade e utilização do sistema.",
          ],
        },
      ]}
    />
  );
}
