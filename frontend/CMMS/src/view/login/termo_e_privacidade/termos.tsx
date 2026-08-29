// src/view/login/termo_e_privacidade/termos.tsx
import { LegalDocumentScreen } from "@/components/legal-document-screen";

export default function TermosScreen() {
  return (
    <LegalDocumentScreen
      title="Termos de Uso"
      lastUpdated="29/08/2026"
      sections={[
        {
          title: "1. Aceitação dos Termos",
          paragraphs: [
            "Ao acessar e utilizar o sistema CMMS, você declara estar ciente e de acordo com os presentes Termos de Uso, comprometendo-se a cumprir todas as condições, regras e responsabilidades estabelecidas neste documento.",
            "A utilização do sistema representa sua concordância integral com estes Termos de Uso. Caso você não concorde com qualquer uma das disposições apresentadas neste documento, deverá interromper a utilização do sistema.",
            "O acesso e a utilização do CMMS são destinados exclusivamente aos usuários autorizados pela organização. Ao utilizar o sistema, o usuário declara que possui autorização para acessá-lo e que utilizará seus recursos exclusivamente para as finalidades relacionadas às suas atividades.",
            "O usuário declara estar ciente de que é responsável pela utilização de sua conta e pelas ações realizadas por meio de suas credenciais de acesso, devendo manter suas informações de autenticação em sigilo e não compartilhá-las com terceiros.",
            "A concordância com estes Termos de Uso implica o compromisso de utilizar o sistema de forma adequada, ética, responsável e de acordo com as políticas e procedimentos estabelecidos pela organização.",
            "O usuário não deverá utilizar o sistema para fins ilícitos, para obter acesso não autorizado a informações ou funcionalidades, para modificar ou excluir dados de forma indevida ou para realizar qualquer ação que possa comprometer a segurança, integridade, disponibilidade ou funcionamento do CMMS.",
            "A organização poderá alterar, atualizar ou complementar estes Termos de Uso sempre que necessário. A versão vigente estará disponível para consulta no sistema, e a continuidade da utilização do CMMS após eventuais alterações representará a concordância com os termos atualizados.",
            "Ao acessar ou utilizar o CMMS, você confirma que leu, compreendeu e concorda com as disposições estabelecidas nestes Termos de Uso.",
          ],
        },

        {
          title: "2. Uso do Sistema",
          paragraphs: [
            "O sistema CMMS destina-se ao controle, planejamento, acompanhamento e monitoramento das atividades relacionadas à manutenção de equipamentos, máquinas, instalações e demais ativos da organização.",
            "O acesso e a utilização do sistema são restritos aos usuários previamente autorizados pela organização, de acordo com suas respectivas funções, responsabilidades e níveis de acesso.",
            "Cada usuário deverá utilizar o sistema exclusivamente para finalidades relacionadas às suas atividades profissionais e de acordo com as orientações, procedimentos e políticas estabelecidos pela organização.",
            "As informações inseridas no sistema devem ser fornecidas de forma correta, completa e atualizada, especialmente dados relacionados a equipamentos, ordens de serviço, manutenções, ocorrências, peças, materiais, serviços e demais registros operacionais.",
            "O usuário é responsável pela utilização das funcionalidades disponibilizadas de acordo com suas permissões, não devendo tentar acessar, modificar, excluir ou manipular informações, recursos ou áreas do sistema para os quais não possua autorização.",
            "É proibida a utilização do sistema para fins ilícitos, fraudulentos ou que possam causar danos à organização, a outros usuários, aos equipamentos, aos dados ou à infraestrutura tecnológica utilizada pelo CMMS.",
            "Também não é permitido compartilhar credenciais de acesso, permitir que terceiros utilizem sua conta ou utilizar as credenciais de outro usuário. As credenciais são pessoais e devem ser mantidas em sigilo.",
            "O usuário deverá comunicar à organização qualquer suspeita de acesso não autorizado, uso indevido da conta, falha de segurança ou comportamento irregular identificado durante a utilização do sistema.",
            "A organização poderá monitorar os acessos e as atividades realizadas no sistema para fins de segurança, auditoria, controle operacional, manutenção da integridade dos dados e cumprimento de suas políticas internas, observada a legislação aplicável.",
            "A organização poderá suspender, limitar ou revogar o acesso de qualquer usuário quando houver descumprimento destes Termos de Uso, utilização inadequada do sistema, violação de políticas internas ou qualquer situação que represente risco à segurança ou ao funcionamento do CMMS.",
            "A utilização do sistema deverá respeitar a legislação aplicável, as normas internas da organização e os demais documentos e políticas relacionados ao uso da plataforma.",
            "O uso do CMMS não autoriza o usuário a utilizar, copiar, modificar, distribuir ou explorar qualquer recurso do sistema para finalidade diferente daquela para a qual o acesso foi concedido.",
          ],
        },

        {
          title: "3. Responsabilidades do Usuário",
          paragraphs: [
            "O usuário é responsável pela veracidade, precisão, integridade e atualização das informações registradas no sistema, incluindo dados relacionados a equipamentos, manutenções, ordens de serviço, custos, materiais, peças, fornecedores e prestadores de serviço.",
            "O usuário deverá registrar as informações de forma clara, correta e suficientemente detalhada, evitando o preenchimento de dados falsos, incompletos, inconsistentes ou que possam comprometer a confiabilidade das informações utilizadas pela organização.",
            "É responsabilidade do usuário revisar as informações inseridas antes de concluí-las ou submetê-las ao sistema, bem como corrigir eventuais erros identificados, sempre que possuir permissão para realizar a alteração.",
            "O usuário deverá utilizar exclusivamente sua própria conta e manter suas credenciais de acesso em sigilo, sendo responsável pelas ações realizadas por meio de sua conta.",
            "O usuário deverá respeitar os níveis de acesso e as permissões atribuídos à sua conta, não tentando acessar, alterar, excluir ou utilizar informações e funcionalidades que não estejam autorizadas para sua função.",
            "O usuário deverá preservar a confidencialidade das informações às quais tiver acesso por meio do sistema, não devendo compartilhá-las com pessoas não autorizadas ou utilizá-las para finalidades diferentes das atividades da organização.",
            "É responsabilidade do usuário comunicar à organização qualquer erro, inconsistência, acesso não autorizado, falha de segurança ou uso indevido identificado no sistema.",
            "O usuário deverá utilizar o CMMS de forma responsável e em conformidade com estes Termos de Uso, com as políticas internas da organização e com a legislação aplicável.",
            "O usuário reconhece que informações incorretas, incompletas ou inseridas de maneira inadequada podem comprometer relatórios, indicadores, históricos de manutenção, controles de custos e processos de tomada de decisão da organização.",
            "O descumprimento das responsabilidades estabelecidas nesta seção poderá resultar na revisão, suspensão ou revogação das permissões de acesso ao sistema, sem prejuízo das demais medidas administrativas cabíveis.",
          ],
        },

        {
          title: "4. Conta e Credenciais de Acesso",
          paragraphs: [
            "O acesso ao CMMS poderá depender da criação de uma conta individual, vinculada às informações fornecidas pelo usuário e às permissões definidas pela organização.",
            "O usuário deverá fornecer informações verdadeiras, precisas e atualizadas durante o processo de cadastro e deverá comunicar à organização qualquer alteração relevante em seus dados cadastrais.",
            "As credenciais de acesso são pessoais e intransferíveis. O usuário não poderá compartilhar sua senha, permitir que terceiros utilizem sua conta ou utilizar credenciais pertencentes a outro usuário.",
            "O usuário deverá adotar medidas razoáveis para proteger suas credenciais contra acesso ou utilização indevida e deverá comunicar imediatamente à organização qualquer suspeita de comprometimento de sua conta.",
            "A organização poderá realizar procedimentos de autenticação, redefinição de credenciais e outras medidas de segurança necessárias para proteger as contas e os recursos do sistema.",
            "A organização poderá bloquear ou suspender temporariamente uma conta quando identificar indícios de acesso indevido, comportamento incompatível com os padrões de segurança ou risco à integridade do sistema.",
          ],
        },

        {
          title: "5. Dados e Registros do Sistema",
          paragraphs: [
            "Os registros inseridos no CMMS deverão estar relacionados às atividades e finalidades para as quais o sistema foi disponibilizado pela organização.",
            "O usuário não deverá inserir no sistema informações desnecessárias, ilícitas, fraudulentas ou incompatíveis com as atividades da organização.",
            "Os registros realizados no sistema poderão ser utilizados para manutenção do histórico operacional, acompanhamento das atividades, geração de relatórios, indicadores, auditorias e demais finalidades relacionadas à gestão de manutenção.",
            "A organização poderá manter registros de alterações, operações e atividades realizadas no sistema quando necessário para segurança, auditoria, rastreabilidade, prevenção de fraudes ou cumprimento de obrigações legais e regulatórias.",
            "O tratamento de dados pessoais realizado no âmbito do CMMS deverá observar a Política de Privacidade aplicável e a legislação brasileira de proteção de dados pessoais.",
          ],
        },

        {
          title: "6. Propriedade Intelectual",
          paragraphs: [
            "O CMMS, incluindo sua estrutura, código-fonte, interface, identidade visual, elementos gráficos, textos, funcionalidades, componentes, documentação e demais elementos que o compõem, poderá estar protegido pela legislação aplicável de propriedade intelectual.",
            "Salvo quando expressamente autorizado pela organização ou permitido pela legislação aplicável, o usuário não poderá copiar, reproduzir, modificar, distribuir, comercializar, realizar engenharia reversa ou explorar indevidamente qualquer elemento protegido do sistema.",
            "O acesso ao CMMS não representa transferência ao usuário de qualquer direito de propriedade sobre o sistema, seu código-fonte, sua estrutura, sua interface ou seus demais elementos.",
            "Os dados e informações inseridos pelos usuários permanecerão sujeitos às regras, direitos e responsabilidades estabelecidos pela organização, pela legislação aplicável e pelos contratos ou políticas pertinentes.",
          ],
        },

        {
          title: "7. Segurança da Informação",
          paragraphs: [
            "O usuário deverá utilizar o sistema de maneira a preservar a segurança, confidencialidade, integridade e disponibilidade das informações e recursos disponibilizados.",
            "É proibida qualquer tentativa de explorar vulnerabilidades, contornar mecanismos de autenticação ou autorização, obter acesso não autorizado, introduzir códigos maliciosos ou interferir no funcionamento normal do sistema.",
            "Também é proibida a realização de atividades que possam causar sobrecarga, indisponibilidade, degradação de desempenho ou qualquer outro prejuízo à infraestrutura utilizada pelo CMMS.",
            "O usuário deverá comunicar à organização, assim que possível, qualquer vulnerabilidade, incidente, comportamento anormal ou suspeita de comprometimento da segurança identificada durante a utilização do sistema.",
            "A organização poderá adotar medidas preventivas ou corretivas, incluindo bloqueios, restrições de acesso, alterações de configuração e outras providências necessárias para preservar a segurança do sistema.",
          ],
        },

        {
          title: "8. Disponibilidade e Manutenção",
          paragraphs: [
            "A organização buscará manter o CMMS disponível e funcionando adequadamente, mas a disponibilidade contínua e ininterrupta do sistema não poderá ser garantida em todas as circunstâncias.",
            "O sistema poderá ficar temporariamente indisponível em razão de manutenção programada, atualizações, correções, falhas técnicas, problemas de infraestrutura, indisponibilidade de serviços de terceiros ou outros eventos que possam afetar seu funcionamento.",
            "Sempre que possível, manutenções programadas ou indisponibilidades previstas poderão ser comunicadas aos usuários com antecedência compatível com a natureza da intervenção.",
            "A indisponibilidade temporária do sistema não deverá ser interpretada como autorização para utilização de mecanismos não autorizados destinados a contornar controles de segurança ou acesso.",
          ],
        },

        {
          title: "9. Limitação de Responsabilidade",
          paragraphs: [
            "O CMMS é disponibilizado como ferramenta de apoio à gestão e ao controle das atividades de manutenção, não substituindo a avaliação técnica, o julgamento profissional ou as decisões dos responsáveis pelas atividades realizadas pela organização.",
            "A organização não deverá ser responsabilizada por decisões tomadas exclusivamente com base em informações incorretas, incompletas ou desatualizadas inseridas pelos próprios usuários.",
            "O usuário permanece responsável pela conferência das informações sob sua responsabilidade e pela adoção das medidas necessárias para garantir a qualidade e a confiabilidade dos registros realizados.",
            "Nenhuma disposição destes Termos de Uso deverá ser interpretada como exclusão ou limitação de responsabilidade quando tal exclusão ou limitação não for permitida pela legislação aplicável.",
          ],
        },

        {
          title: "10. Suspensão e Encerramento do Acesso",
          paragraphs: [
            "A organização poderá suspender, limitar ou revogar o acesso de um usuário ao CMMS quando houver descumprimento destes Termos de Uso, das políticas internas ou da legislação aplicável.",
            "O acesso também poderá ser suspenso preventivamente quando houver indícios de comprometimento da segurança, utilização indevida da conta, tentativa de acesso não autorizado ou comportamento que possa representar risco ao sistema ou às informações nele armazenadas.",
            "O encerramento ou suspensão do acesso não elimina responsabilidades decorrentes de atos praticados durante o período em que o usuário possuía acesso ao sistema.",
            "Após o encerramento do vínculo do usuário com a organização ou após a revogação de suas permissões, as informações relacionadas à sua conta poderão ser tratadas e mantidas de acordo com as políticas internas, obrigações legais e regras de retenção aplicáveis.",
          ],
        },

        {
          title: "11. Privacidade e Proteção de Dados",
          paragraphs: [
            "O tratamento de dados pessoais realizado por meio do CMMS deverá observar a legislação brasileira aplicável à proteção de dados pessoais, especialmente a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais – LGPD).",
            "As informações sobre os dados pessoais tratados, suas finalidades, bases legais, compartilhamentos, períodos de retenção, medidas de segurança e direitos dos titulares estão descritas na Política de Privacidade do CMMS.",
            "A utilização do sistema deverá ocorrer em conformidade com a Política de Privacidade e com as demais regras aplicáveis ao tratamento de dados pessoais realizado pela organização.",
          ],
        },

        {
          title: "12. Alterações dos Termos",
          paragraphs: [
            "Estes Termos de Uso poderão ser alterados, atualizados ou complementados sempre que necessário para refletir mudanças no sistema, nas funcionalidades disponibilizadas, nas políticas internas ou na legislação aplicável.",
            "A versão atualizada dos Termos de Uso será disponibilizada para consulta no sistema.",
            "Quando uma alteração for relevante para os direitos, deveres ou responsabilidades dos usuários, a organização poderá adotar medidas razoáveis para comunicar a alteração aos usuários afetados.",
            "A utilização do sistema após a disponibilização de uma nova versão dos Termos de Uso representará a concordância do usuário com as disposições atualizadas, quando juridicamente aplicável.",
          ],
        },

        {
          title: "13. Disposições Gerais",
          paragraphs: [
            "A eventual tolerância da organização quanto ao descumprimento de qualquer disposição destes Termos de Uso não deverá ser interpretada como renúncia ao direito de exigir seu cumprimento posteriormente.",
            "Caso qualquer disposição destes Termos de Uso seja considerada inválida, ilegal ou inexequível, as demais disposições permanecerão válidas e aplicáveis na extensão permitida pela legislação.",
            "Estes Termos de Uso deverão ser interpretados em conjunto com a Política de Privacidade, as políticas internas da organização e demais documentos aplicáveis à utilização do CMMS.",
            "O usuário deverá observar as normas, procedimentos e orientações internas da organização relacionadas à utilização do sistema e à proteção das informações às quais tenha acesso.",
          ],
        },

        {
          title: "14. Legislação Aplicável",
          paragraphs: [
            "Estes Termos de Uso serão interpretados de acordo com a legislação brasileira aplicável.",
            "A utilização do CMMS deverá observar, quando aplicável, as normas relacionadas à proteção de dados pessoais, segurança da informação, propriedade intelectual, relações contratuais e demais disposições legais pertinentes às atividades desenvolvidas pela organização.",
            "Eventuais controvérsias relacionadas à utilização do sistema deverão ser tratadas de acordo com os instrumentos contratuais aplicáveis entre as partes e, na ausência de disposição específica, conforme a legislação brasileira.",
          ],
        },

        {
          title: "15. Canal de Atendimento",
          paragraphs: [
            "Dúvidas, solicitações, comunicações relacionadas à utilização do sistema, problemas de acesso, suspeitas de uso indevido ou questões relacionadas a estes Termos de Uso deverão ser encaminhadas aos canais oficiais disponibilizados pela organização.",
            "As solicitações relacionadas à proteção de dados pessoais deverão seguir também os procedimentos e canais indicados na Política de Privacidade do CMMS.",
          ],
        },
      ]}
    />
  );
}
