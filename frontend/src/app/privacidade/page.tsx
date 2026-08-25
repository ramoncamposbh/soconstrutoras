import Link from 'next/link';

export const metadata = {
  title: 'Política de Privacidade — SóConstrutoras',
  description: 'Política de privacidade da plataforma SóConstrutoras / Faicoh.',
};

export default function PrivacidadePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#F8FAF9' }}>
      {/* Header simples */}
      <div style={{ background: '#03201A', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link href="/" style={{ color: '#22D497', fontWeight: 800, fontSize: 20, textDecoration: 'none' }}>
          SóConstrutoras
        </Link>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>/ Política de Privacidade</span>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0D1F1A', marginBottom: 8 }}>
          Política de Privacidade
        </h1>
        <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 40 }}>
          Última atualização: 25 de agosto de 2026
        </p>

        <div style={{ fontSize: 15, lineHeight: 1.8, color: '#374151' }}>

          <Section title="1. Quem somos">
            <p>A <strong>SóConstrutoras</strong> (operada pela Faicoh Tecnologia Imobiliária) é uma plataforma digital que conecta construtoras, parceiros imobiliários e compradores de imóveis novos. Nossa sede está localizada em Belo Horizonte, Minas Gerais, Brasil.</p>
            <p>Contato: <a href="mailto:contato@faicoh.com.br" style={{ color: '#0E8F6E' }}>contato@faicoh.com.br</a></p>
          </Section>

          <Section title="2. Dados que coletamos">
            <p>Coletamos os seguintes dados pessoais:</p>
            <ul style={{ paddingLeft: 20, marginTop: 8 }}>
              <li><strong>Dados de conta:</strong> nome, e-mail e foto de perfil (via Google Sign-In ou cadastro próprio)</li>
              <li><strong>Dados de uso:</strong> empreendimentos visualizados, favoritos salvos, buscas realizadas</li>
              <li><strong>Dados de contato (leads):</strong> nome, e-mail e telefone informados ao solicitar contato com construtoras</li>
              <li><strong>Dados técnicos:</strong> endereço IP, tipo de navegador, sistema operacional e cookies de sessão</li>
            </ul>
          </Section>

          <Section title="3. Como usamos seus dados">
            <p>Utilizamos seus dados para:</p>
            <ul style={{ paddingLeft: 20, marginTop: 8 }}>
              <li>Criar e gerenciar sua conta na plataforma</li>
              <li>Personalizar a experiência de busca de imóveis</li>
              <li>Encaminhar seu interesse às construtoras que você contatar</li>
              <li>Enviar comunicações transacionais (confirmações, atualizações de conta)</li>
              <li>Melhorar nossos serviços e corrigir problemas técnicos</li>
              <li>Cumprir obrigações legais</li>
            </ul>
            <p>Não vendemos nem compartilhamos seus dados pessoais com terceiros para fins de marketing sem seu consentimento.</p>
          </Section>

          <Section title="4. Login com Google">
            <p>Ao escolher "Entrar com Google", utilizamos a API OAuth 2.0 do Google para autenticar sua identidade. Recebemos apenas seu nome, e-mail e foto de perfil pública. Não temos acesso à sua senha do Google nem a outros dados da sua conta Google.</p>
            <p>Você pode revogar o acesso da SóConstrutoras à sua conta Google a qualquer momento em <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener" style={{ color: '#0E8F6E' }}>myaccount.google.com/permissions</a>.</p>
          </Section>

          <Section title="5. Cookies">
            <p>Usamos cookies essenciais para manter sua sessão ativa após o login. Não utilizamos cookies de rastreamento de terceiros para publicidade.</p>
          </Section>

          <Section title="6. Compartilhamento de dados">
            <p>Seus dados podem ser compartilhados com:</p>
            <ul style={{ paddingLeft: 20, marginTop: 8 }}>
              <li><strong>Construtoras:</strong> quando você solicita contato ou demonstra interesse em um empreendimento</li>
              <li><strong>Provedores de infraestrutura:</strong> Vercel (hospedagem frontend), Railway (backend), Neon (banco de dados), AWS S3 (armazenamento de arquivos) — todos regidos por seus próprios termos e políticas de privacidade</li>
              <li><strong>Autoridades:</strong> quando exigido por lei ou ordem judicial</li>
            </ul>
          </Section>

          <Section title="7. Seus direitos (LGPD)">
            <p>De acordo com a Lei Geral de Proteção de Dados (Lei 13.709/2018), você tem direito a:</p>
            <ul style={{ paddingLeft: 20, marginTop: 8 }}>
              <li>Confirmar a existência de tratamento dos seus dados</li>
              <li>Acessar seus dados</li>
              <li>Corrigir dados incompletos ou desatualizados</li>
              <li>Solicitar a exclusão dos seus dados pessoais</li>
              <li>Revogar o consentimento a qualquer momento</li>
            </ul>
            <p>Para exercer esses direitos, entre em contato pelo e-mail <a href="mailto:privacidade@faicoh.com.br" style={{ color: '#0E8F6E' }}>privacidade@faicoh.com.br</a>.</p>
          </Section>

          <Section title="8. Segurança">
            <p>Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo criptografia em trânsito (HTTPS/TLS), autenticação JWT com expiração e controle de acesso por perfil (role-based access control).</p>
          </Section>

          <Section title="9. Retenção de dados">
            <p>Mantemos seus dados enquanto sua conta estiver ativa. Após a exclusão da conta, os dados pessoais são removidos em até 30 dias, exceto os que precisam ser retidos por obrigação legal.</p>
          </Section>

          <Section title="10. Alterações desta política">
            <p>Podemos atualizar esta política periodicamente. Quando houver alterações relevantes, notificaremos você por e-mail ou por aviso na plataforma. O uso continuado da plataforma após as alterações implica aceitação da nova política.</p>
          </Section>

          <Section title="11. Contato">
            <p>Dúvidas sobre esta política? Entre em contato:</p>
            <p><strong>E-mail:</strong> <a href="mailto:privacidade@faicoh.com.br" style={{ color: '#0E8F6E' }}>privacidade@faicoh.com.br</a></p>
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
