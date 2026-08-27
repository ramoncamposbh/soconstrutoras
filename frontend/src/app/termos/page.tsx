import Link from 'next/link';

export const metadata = {
  title: 'Termos de Serviço — FAICOH',
  description: 'Termos de serviço da plataforma FAICOH.',
};

export default function TermosPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#F8FAF9' }}>
      {/* Header simples */}
      <div style={{ background: '#03201A', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link href="/" style={{ color: '#22D497', fontWeight: 800, fontSize: 20, textDecoration: 'none' }}>
          SóConstrutoras
        </Link>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>/ Termos de Serviço</span>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0D1F1A', marginBottom: 8 }}>
          Termos de Serviço
        </h1>
        <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 40 }}>
          Última atualização: 25 de agosto de 2026
        </p>

        <div style={{ fontSize: 15, lineHeight: 1.8, color: '#374151' }}>

          <Section title="1. Aceitação dos termos">
            <p>Ao acessar ou utilizar a plataforma <strong>SóConstrutoras</strong> (disponível em faicoh.com.br), você concorda com estes Termos de Serviço. Se não concordar, não utilize a plataforma.</p>
          </Section>

          <Section title="2. Descrição do serviço">
            <p>A SóConstrutoras é uma plataforma imobiliária digital que:</p>
            <ul style={{ paddingLeft: 20, marginTop: 8 }}>
              <li>Publica empreendimentos de construtoras cadastradas</li>
              <li>Permite a compradores buscar, favoritar e solicitar contato sobre imóveis</li>
              <li>Conecta parceiros (corretores e imobiliárias) às construtoras via sistema de distribuição de leads</li>
              <li>Oferece ferramentas como simulador de financiamento e ranking de melhor m²</li>
            </ul>
            <p>A plataforma atua como intermediária de informações e não é parte das negociações imobiliárias realizadas entre construtoras e compradores.</p>
          </Section>

          <Section title="3. Cadastro e conta">
            <p>Para acessar funcionalidades completas, você deve criar uma conta fornecendo informações verdadeiras e atualizadas. Você é responsável pela segurança de suas credenciais de acesso.</p>
            <p>A SóConstrutoras reserva-se o direito de suspender ou encerrar contas que violem estes termos, utilizem informações falsas ou realizem atividades prejudiciais à plataforma.</p>
          </Section>

          <Section title="4. Perfis de usuário">
            <p>A plataforma possui quatro perfis:</p>
            <ul style={{ paddingLeft: 20, marginTop: 8 }}>
              <li><strong>Cliente:</strong> acesso à busca pública, favoritos e simuladores</li>
              <li><strong>Construtora:</strong> cadastro de empreendimentos, unidades e gestão de parceiros</li>
              <li><strong>Parceiro:</strong> recebimento de leads e acesso a empreendimentos vinculados</li>
              <li><strong>Administrador:</strong> acesso total à plataforma</li>
            </ul>
          </Section>

          <Section title="5. Responsabilidades das construtoras">
            <p>Construtoras cadastradas são responsáveis pela veracidade e atualização das informações sobre seus empreendimentos, incluindo preços, disponibilidade, plantas e descrições. A SóConstrutoras não se responsabiliza por informações incorretas ou desatualizadas fornecidas pelas construtoras.</p>
          </Section>

          <Section title="6. Leads e contatos">
            <p>Ao preencher um formulário de interesse, você autoriza o repasse de seus dados de contato (nome, e-mail, telefone) à construtora e/ou parceiro responsável pelo atendimento daquele empreendimento. O atendimento subsequente é responsabilidade exclusiva da construtora/parceiro.</p>
          </Section>

          <Section title="7. Propriedade intelectual">
            <p>Todo o conteúdo da plataforma (código, design, textos, logotipos) é propriedade da Faicoh Tecnologia Imobiliária ou licenciado para uso nela. As imagens e informações de empreendimentos pertencem às respectivas construtoras.</p>
            <p>É vedado reproduzir, copiar ou distribuir qualquer conteúdo da plataforma sem autorização prévia por escrito.</p>
          </Section>

          <Section title="8. Limitação de responsabilidade">
            <p>A SóConstrutoras não se responsabiliza por:</p>
            <ul style={{ paddingLeft: 20, marginTop: 8 }}>
              <li>Negociações, contratos ou transações realizadas entre usuários e construtoras</li>
              <li>Informações incorretas fornecidas por construtoras cadastradas</li>
              <li>Interrupções temporárias do serviço por manutenção ou falhas técnicas</li>
              <li>Danos indiretos decorrentes do uso da plataforma</li>
            </ul>
          </Section>

          <Section title="9. Assinaturas e pagamentos">
            <p>Construtoras podem adquirir planos de assinatura pagos para acesso a funcionalidades avançadas. Os pagamentos são processados de forma segura via Stripe. O cancelamento de assinatura encerra o acesso às funcionalidades premium ao final do período contratado.</p>
          </Section>

          <Section title="10. Conduta do usuário">
            <p>É proibido utilizar a plataforma para:</p>
            <ul style={{ paddingLeft: 20, marginTop: 8 }}>
              <li>Publicar informações falsas ou enganosas</li>
              <li>Realizar atividades fraudulentas ou ilegais</li>
              <li>Tentar acessar áreas não autorizadas do sistema</li>
              <li>Enviar spam ou conteúdo abusivo</li>
              <li>Scraping automatizado de dados sem autorização</li>
            </ul>
          </Section>

          <Section title="11. Alterações dos termos">
            <p>Podemos modificar estes termos a qualquer momento. Alterações significativas serão comunicadas por e-mail ou aviso na plataforma. O uso continuado após a notificação implica aceitação dos novos termos.</p>
          </Section>

          <Section title="12. Lei aplicável e foro">
            <p>Estes termos são regidos pela legislação brasileira. Fica eleito o foro da Comarca de Belo Horizonte/MG para dirimir quaisquer controvérsias decorrentes deste instrumento.</p>
          </Section>

          <Section title="13. Contato">
            <p><strong>E-mail:</strong> <a href="mailto:contato@faicoh.com.br" style={{ color: '#0E8F6E' }}>contato@faicoh.com.br</a></p>
            <p><strong>Site:</strong> <a href="https://faicoh.com.br" style={{ color: '#0E8F6E' }}>faicoh.com.br</a></p>
          </Section>

        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0D1F1A', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #E5E7EB' }}>
        {title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </div>
  );
}
