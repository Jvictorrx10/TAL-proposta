import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router-dom';
import { Arrow, Lightning, Brand } from './ui/Primitives';
import { HomeCatalogPreview } from './catalog/HomeCatalogPreview';
import { products } from './catalog/data';

gsap.registerPlugin(ScrollTrigger);

const services = [
  { name: 'Manutenção', text: 'Sua elétrica merece atenção de perto. Converse com a TAL sobre avaliação, cuidados e os serviços disponíveis para o seu modelo.' },
  { name: 'Revisões', text: 'Um cuidado que acompanha a rotina. Consulte a equipe para planejar as revisões de acordo com o manual e o uso da sua elétrica.' },
  { name: 'Acessórios', text: 'Os detalhes também fazem parte do caminho. Conheça as opções de acessórios e consulte a compatibilidade com a sua moto.' },
];

function HomePage() {
  const root = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement>(null);
  const [interest, setInterest] = useState('Uma moto elétrica');
  const [summary, setSummary] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const [formError, setFormError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const summaryField = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const keyHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus(); }
      if (event.key === 'Tab') {
        const items = [menuButton.current, ...Array.from(menuRef.current?.querySelectorAll<HTMLAnchorElement>('a') ?? [])].filter((item): item is HTMLButtonElement | HTMLAnchorElement => item !== null);
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', keyHandler);
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    menuRef.current?.querySelector('a')?.focus();
    return () => {
      document.removeEventListener('keydown', keyHandler);
      document.body.style.overflow = oldOverflow;
      if (previouslyFocused === menuButton.current) menuButton.current?.focus();
    };
  }, [menuOpen]);

  useLayoutEffect(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const context = gsap.context(() => {
        const entrance = gsap.timeline({ defaults: { ease: 'power3.out' } });
        entrance.from('.hero-line > span', { yPercent: 105, duration: 1.15, stagger: 0.13 }, 0.12)
          .from('.hero-support', { y: 22, opacity: 0, duration: 0.85, stagger: 0.1 }, 0.42)
          .from('.hero-scooter', { xPercent: 16, rotate: -2, opacity: 0, duration: 1.5 }, 0.3)
          .from('.hero-backtype', { y: 45, opacity: 0, duration: 1.2 }, 0.5);

        gsap.to('.hero-object', { xPercent: 8, yPercent: 12, rotation: 2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 } });
        gsap.to('.hero-backtype', { xPercent: -8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 } });

        const mobile = window.matchMedia('(max-width: 700px)').matches;
        gsap.fromTo('.motion-scooter', { xPercent: mobile ? -15 : -28, rotation: -2 }, { xPercent: mobile ? 14 : 28, rotation: 2, ease: 'none', scrollTrigger: { trigger: '.motion-section', start: 'top top', end: 'bottom bottom', scrub: 1.2 } });
        gsap.to('.motion-backtype', { xPercent: -12, ease: 'none', scrollTrigger: { trigger: '.motion-section', start: 'top bottom', end: 'bottom top', scrub: 1 } });
        gsap.fromTo('.motion-copy', { y: 28 }, { y: -24, ease: 'none', scrollTrigger: { trigger: '.motion-section', start: 'top top', end: 'bottom bottom', scrub: 1 } });

        gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((element) => {
          gsap.from(element, { y: 26, opacity: 0, duration: 0.85, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 94%', once: true } });
        });
        gsap.fromTo('.service-image img', { scale: 1.08, yPercent: -4 }, { scale: 1, yPercent: 4, ease: 'none', scrollTrigger: { trigger: '.assistance', start: 'top bottom', end: 'bottom top', scrub: 1 } });
      }, root);
      return () => context.revert();
    });
    const refresh = () => ScrollTrigger.refresh();
    document.fonts.ready.then(refresh);
    const images = Array.from(root.current?.querySelectorAll('img') ?? []);
    images.forEach((image) => image.addEventListener('load', refresh));
    return () => { media.revert(); images.forEach((image) => image.removeEventListener('load', refresh)); };
  }, []);

  function goToContact(subject?: string) {
    if (subject) setInterest(subject);
    document.getElementById('contato')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }

  function prepareInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get('name') ?? '').trim();
    const city = String(data.get('city') ?? '').trim();
    if (name.length < 2 || city.length < 2) {
      setFormError('Preencha seu nome e sua cidade com pelo menos 2 caracteres.');
      form.querySelector<HTMLInputElement>(name.length < 2 ? '#name' : '#city')?.focus();
      return;
    }
    setFormError('');
    const message = String(data.get('message') ?? '').trim();
    setSummary(`Olá, TAL! Meu nome é ${name}, sou de ${city}.\n\nTenho interesse em: ${interest}.\n${message ? `\n${message}\n` : ''}\nGostaria de conhecer as opções e as condições de atendimento para a minha região.`);
    setCopyStatus('');
    dialog.current?.showModal();
  }

  async function copyInquiry() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopyStatus('Consulta copiada. Você já pode compartilhar a mensagem.');
    } catch {
      summaryField.current?.focus();
      summaryField.current?.select();
      setCopyStatus('Selecionei a mensagem. Use a opção Copiar do seu dispositivo.');
    }
  }

  function downloadInquiry() {
    const url = URL.createObjectURL(new Blob([summary], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'minha-consulta-tal.txt';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <div ref={root} className="site">
    <a className="skip-link" href="#principal">Ir para o conteúdo</a>
    <header className="site-header">
      <a href="#inicio" className="brand-link" aria-label="TAL — início"><Brand /></a>
      <nav className="desktop-nav" aria-label="Navegação principal">
        <Link to="/catalogo">Catálogo</Link><a href="#mobilidade">Mobilidade</a><a href="#assistencia">Assistência</a>
      </nav>
      <a href="#contato" className="button button-dark header-cta">Fale com a TAL <Arrow /></a>
      <button ref={menuButton} type="button" className={`menu-button ${menuOpen ? 'is-open' : ''}`} aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={() => setMenuOpen(!menuOpen)}><span /><span /></button>
    </header>

    {menuOpen && <nav ref={menuRef} id="mobile-menu" className="mobile-nav" aria-label="Navegação móvel">
      {[['Catálogo', '/catalogo'], ['Modelos', 'modelos'], ['Mobilidade', 'mobilidade'], ['Assistência', 'assistencia'], ['Contato', 'contato']].map(([label, id]) => <a key={id} href={id.startsWith('/') ? id : `#${id}`} onClick={() => setMenuOpen(false)}>{label}<Arrow /></a>)}
      <span className="mobile-nav-note">Seu próximo movimento.</span>
    </nav>}

    <main id="principal">
      <section id="inicio" className="hero" aria-labelledby="hero-heading">
        <div className="hero-content">
          <h1 id="hero-heading" tabIndex={-1}><span className="hero-line"><span>Seu próximo</span></span>{' '}<span className="hero-line"><span>movimento.</span></span></h1>
          <p className="hero-description hero-support">Motos elétricas para viver<br className="desktop-break" /> a cidade de outro jeito.</p>
          <a href="#modelos" className="button button-dark hero-action hero-support">Explore os modelos <Arrow /></a>
        </div>
        <div className="electric-note hero-support"><Lightning /><span>Elétrica<br />por natureza.</span></div>
        <div className="hero-backtype" aria-hidden="true">Elétrica</div>
        <div className="hero-object"><img className="hero-scooter" src="/images/scooter-ivory.webp" srcSet="/images/scooter-ivory-mobile.webp 960w, /images/scooter-ivory.webp 1536w" sizes="(max-width: 700px) 120vw, 85vw" alt="Scooter elétrica ilustrativa branca, vista de perfil" width="1536" height="1024" fetchPriority="high" /></div>
        <div className="hero-bottom"><span className="image-note">Imagem ilustrativa</span><a href="#mobilidade" className="scroll-link" aria-label="Conheça a mobilidade TAL"><span>Um novo jeito de ir</span><Arrow /></a></div>
      </section>

      <section id="mobilidade" className="motion-section" aria-labelledby="motion-heading">
        <div className="motion-scene">
          <div className="wall-texture" aria-hidden="true">{Array.from({ length: 24 }, (_, i) => <span key={i} />)}</div>
          <div className="motion-copy"><h2 id="motion-heading">Menos ruído.<br />Mais presença.</h2><p>O caminho é o mesmo.<br />A forma de viver, outra.</p></div>
          <div className="motion-backtype" aria-hidden="true">Em movimento</div>
          <img className="motion-scooter" src="/images/scooter-ivory.webp" srcSet="/images/scooter-ivory-mobile.webp 960w, /images/scooter-ivory.webp 1536w" sizes="(max-width: 700px) 120vw, 85vw" alt="Conceito de scooter elétrica branca em movimento" width="1536" height="1024" loading="lazy" />
          <div className="motion-bottom"><span>Mobilidade elétrica.<br />Com a identidade TAL.</span><a href="#modelos" className="round-link" aria-label="Ver os conceitos de modelos"><Arrow /></a></div>
        </div>
      </section>

      <HomeCatalogPreview />

      <section id="assistencia" className="assistance" aria-labelledby="assistance-heading">
        <figure className="service-image"><img src="/images/assistance.webp" alt="Imagem ilustrativa de uma inspeção no freio de uma scooter elétrica" width="1024" height="1536" loading="lazy" /><figcaption>Assistência para continuar seu caminho.</figcaption></figure>
        <div className="service-content">
          <h2 id="assistance-heading" data-reveal>Cuidado em<br />cada caminho.</h2>
          <p className="service-intro" data-reveal>Da primeira escolha à próxima revisão.<br />Conte sempre com a TAL.</p>
          <div className="service-list">{services.map((service) => <details key={service.name} data-reveal><summary>{service.name}<span className="plus-icon" aria-hidden="true" /></summary><p>{service.text}</p></details>)}</div>
          <button className="button button-light" onClick={() => goToContact('Assistência e serviços')} data-reveal>Converse sobre assistência <Arrow /></button>
        </div>
      </section>

      <section className="questions section-space" aria-labelledby="questions-heading">
        <h2 id="questions-heading" data-reveal>Dúvidas<br />no caminho.</h2>
        <div className="question-list">
          <details data-reveal><summary>Posso consultar de outra cidade?<span className="plus-icon" aria-hidden="true" /></summary><p>Sim. Conte sua cidade e estado na consulta. A TAL poderá confirmar as opções de atendimento, disponibilidade e condições para sua região.</p></details>
          <details data-reveal><summary>Como escolho minha elétrica?<span className="plus-icon" aria-hidden="true" /></summary><p>Comece pelo seu trajeto, pela frequência de uso e pelo que você procura. A equipe pode ajudar a comparar os modelos disponíveis e as características confirmadas de cada um.</p></details>
          <details data-reveal><summary>As motos das imagens estão à venda?<span className="plus-icon" aria-hidden="true" /></summary><p>As imagens e os conceitos desta apresentação são ilustrativos. O catálogo, as fotos reais, os preços e as especificações devem ser confirmados com a TAL.</p></details>
          <details data-reveal><summary>O que preciso saber antes de rodar?<span className="plus-icon" aria-hidden="true" /></summary><p>Confira a classificação do veículo, as regras vigentes, os documentos e os equipamentos necessários. Esses requisitos dependem do modelo e do local de circulação.</p></details>
        </div>
      </section>

      <section id="contato" className="contact section-space" aria-labelledby="contact-heading">
        <div className="contact-copy"><h2 id="contact-heading" data-reveal>Seu caminho<br />começa aqui.</h2><p data-reveal>Conte de onde você é e o que procura.<br />Vamos pensar no seu próximo movimento.</p><div className="contact-signoff" data-reveal><Lightning /><span>Perto ou longe,<br />a conversa começa aqui.</span></div></div>
        <form className="contact-form" onSubmit={prepareInquiry} data-reveal>
          <div className="form-row"><label htmlFor="name">Seu nome</label><input id="name" name="name" autoComplete="name" placeholder="Como podemos te chamar?" required minLength={2} maxLength={80} /></div>
          <div className="form-row"><label htmlFor="city">Sua cidade e estado</label><input id="city" name="city" autoComplete="address-level2" placeholder="Ex.: Pinhais, PR" required minLength={2} maxLength={100} /></div>
          <div className="form-row"><label htmlFor="interest">O que você procura?</label><div className="select-wrap"><select id="interest" name="interest" value={interest} onChange={(event) => setInterest(event.target.value)}><option>Uma moto elétrica</option>{products.map((product) => <option key={product.id}>Modelo {product.name}</option>)}<option>Assistência e serviços</option><option>Acessórios</option><option>Outras informações</option></select><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m4 7 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg></div></div>
          <div className="form-row"><label htmlFor="message">Sua mensagem <span>(opcional)</span></label><textarea id="message" name="message" rows={3} maxLength={1500} placeholder="Seu trajeto, suas dúvidas, seu jeito de ir…" /></div>
          {formError && <p id="form-error" className="form-error" role="alert">{formError}</p>}
          <button type="submit" className="button button-dark form-submit">Preparar minha consulta <Arrow /></button>
          <p className="form-note">Sua mensagem ficará pronta para copiar. Nenhum dado é enviado por este protótipo.</p>
        </form>
      </section>
    </main>

    <footer className="footer"><div className="footer-main"><a href="#inicio" aria-label="TAL — voltar ao início"><Brand footer /></a><p>Seu próximo<br />movimento é elétrico.</p><nav aria-label="Navegação do rodapé"><a href="#modelos">Modelos</a><a href="#assistencia">Assistência</a><a href="https://www.instagram.com/tal_mobilidade/" target="_blank" rel="noopener noreferrer">Instagram <span className="sr-only">(abre em outra aba)</span></a></nav><a className="footer-top" href="#inicio" aria-label="Voltar ao topo"><Arrow /></a></div><div className="footer-bottom"><span>TAL Mobilidade Elétrica</span><span>Apresentação conceitual · Imagens ilustrativas</span></div></footer>

    <dialog ref={dialog} className="inquiry-dialog" aria-labelledby="inquiry-heading" onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <button type="button" className="dialog-close" aria-label="Fechar consulta" onClick={() => dialog.current?.close()}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" stroke="currentColor" strokeWidth="1.5" /></svg></button>
      <Lightning className="dialog-lightning" /><h2 id="inquiry-heading">Seu próximo passo.</h2><p>Sua consulta está pronta. Copie ou baixe a mensagem para compartilhar com a TAL pelo canal de sua preferência.</p>
      <label htmlFor="inquiry-summary">Sua consulta</label><textarea ref={summaryField} id="inquiry-summary" value={summary} readOnly rows={8} />
      <div className="dialog-actions"><button type="button" className="button button-dark" onClick={copyInquiry}>Copiar consulta <Arrow /></button><button type="button" className="text-button" onClick={downloadInquiry}>Baixar mensagem</button></div>
      <p className="copy-status" role="status" aria-live="polite">{copyStatus}</p>
      <button type="button" className="edit-inquiry" onClick={() => dialog.current?.close()}>Voltar e editar</button>
    </dialog>
  </div>;
}

export default HomePage;
