import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowDown, ArrowRight, BookOpen, Bus, ChevronDown, HeartHandshake, Languages, Leaf, Library, MapPin, Menu, Phone, Sparkles, Utensils, X } from "lucide-react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const PrairieScene = lazy(() => import("./PrairieScene").then((module) => ({ default: module.PrairieScene })));

gsap.registerPlugin(ScrollTrigger);

const learningAndSupports = [
  { number: "01", icon: Languages, title: "Dakota language", summary: "Language, identity, and connection across generations.", body: "The Dakota Language Program supports language revitalization and cultural preservation through speaking, listening, reading, writing, storytelling, songs, games, and cultural activities.", image: "/images/dakota-app-485x1024-1-e7e19d24ca.jpg" },
  { number: "02", icon: Sparkles, title: "Culture and community", summary: "Belonging, respect, and learning together.", body: "Culture is present across the learning day, strengthening students' connection to Standing Buffalo Dakota Nation, family, community, and the responsibilities that come with belonging.", image: "/images/sbec-scaled-0797b7b134.jpg" },
  { number: "03", icon: Leaf, title: "Land-based learning", summary: "The Qu'Appelle Valley becomes part of the classroom.", body: "Land-based education connects students with hands-on experiences, cultural teachings, environmental education, stewardship, and community collaboration.", image: "/images/land-based-fe96adeac4.png" },
  { number: "04", icon: BookOpen, title: "Academics", summary: "Focused Pre-K to Grade 9 learning.", body: "Saskatchewan curriculum is strengthened by close relationships among learners, educators, families, and community, helping each student build skills, curiosity, and confidence.", image: "/images/stock-classroom.jpg" },
  { number: "05", icon: Utensils, title: "Nutrition program", summary: "Wholesome meals that support learning and wellness.", body: "The school kitchen is dedicated to providing wholesome, nutritious meals that fuel students for success in academic and extracurricular pursuits.", image: "/images/20210611-091837-scaled-233b7bb3e8.jpg" },
  { number: "06", icon: Bus, title: "Transportation", summary: "Reliable travel and clear family communication.", body: "Transportation services prioritize safe, efficient travel to and from school, with communication for families about routes, schedules, and changes.", image: "/images/dji-0014-scaled-3884d76a1a.jpg" },
  { number: "07", icon: HeartHandshake, title: "Student counselling", summary: "Support for well-being, resilience, and success.", body: "Counselling services help students navigate academic challenges, personal concerns, and social-emotional development in a supportive school environment.", image: "/images/studentcounsellingservices-e631b319d4.jpg" },
];

function BuffaloLogo({ className = "" }: { className?: string }) {
  return <img className={`buffalo-logo ${className}`} src="/images/buffalo-logo-vector.svg" alt="" aria-hidden="true" />;
}

function BuffaloFallback() {
  return <div className="prairie-scene prairie-scene-static" aria-hidden="true"><img src="/images/buffalo-logo-vector.svg" alt="" /></div>;
}

export function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activitiesOpen, setActivitiesOpen] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const activitiesTriggerRef = useRef<HTMLButtonElement>(null);
  const activitiesCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const updateHeader = () => setScrolled(window.scrollY > 30);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  useEffect(() => {
    if (!activitiesOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActivitiesOpen(false);
        activitiesTriggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    const focusTimer = window.setTimeout(() => activitiesCloseRef.current?.focus(), 60);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [activitiesOpen]);

  useLayoutEffect(() => {
    const root = shellRef.current;
    if (!root) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const prefersReducedMotion = media.matches;
    if (prefersReducedMotion) document.documentElement.classList.add("reduced-motion");

    const lenis = prefersReducedMotion ? null : new Lenis({
      duration: 1.22,
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.05,
      anchors: { offset: -76 },
    });

    const tick = (time: number) => lenis?.raf(time * 1000);
    if (lenis) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }

    const responsiveMotion = gsap.matchMedia();
    const context = gsap.context(() => {
      if (!prefersReducedMotion) {
        const heroTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "+=25%",
            pin: true,
            scrub: 1.1,
            anticipatePin: 1,
          },
        });

        heroTimeline
          .to(".hero-image", { scale: 1.16, yPercent: 8, ease: "none" }, 0)
          .to(".hero-content", { y: -70, opacity: 0.18, ease: "none" }, 0)
          .to(".prairie-scene", { y: 55, scale: 0.92, ease: "none" }, 0)
          .to(".hero-hills-back", { xPercent: -5, ease: "none" }, 0)
          .to(".hero-hills-front", { xPercent: 7, ease: "none" }, 0);
      }

      responsiveMotion.add("(min-width: 701px)", () => {
        const horizontalSections = Array.from(root.querySelectorAll<HTMLElement>("[data-horizontal]"));

        horizontalSections.forEach((section) => {
          const track = section.querySelector<HTMLElement>(".horizontal-track");
          if (!track) return;

          const distance = () => Math.max(track.scrollWidth - window.innerWidth, 0);
          const syncSectionHeight = () => {
            section.style.setProperty("--horizontal-distance", `${distance()}px`);
          };

          syncSectionHeight();
          gsap.to(track, {
            x: () => -distance(),
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: () => `+=${distance()}`,
              scrub: prefersReducedMotion ? true : 0.7,
              invalidateOnRefresh: true,
              onRefresh: syncSectionHeight,
            },
          });
        });

        return () => horizontalSections.forEach((section) => section.style.removeProperty("--horizontal-distance"));
      });

      if (!prefersReducedMotion) {
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
          gsap.fromTo(element, { y: 46, opacity: 0 }, {
            y: 0,
            opacity: 1,
            duration: 1.05,
            ease: "power3.out",
            scrollTrigger: { trigger: element, start: "top 86%", once: true },
          });
        });

        root.querySelectorAll<HTMLElement>("[data-stagger]").forEach((group) => {
          gsap.fromTo(Array.from(group.children), { y: 38, opacity: 0 }, {
            y: 0,
            opacity: 1,
            duration: 0.9,
            stagger: 0.11,
            ease: "power3.out",
            scrollTrigger: { trigger: group, start: "top 84%", once: true },
          });
        });

        root.querySelectorAll<HTMLElement>("[data-parallax]").forEach((element) => {
          const amount = Number(element.dataset.parallax || 10);
          gsap.fromTo(element, { yPercent: -amount }, {
            yPercent: amount,
            ease: "none",
            scrollTrigger: { trigger: element, start: "top bottom", end: "bottom top", scrub: 1.2 },
          });
        });
      }
    }, root);

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh, { once: true });
    const refreshTimer = window.setTimeout(refresh, 250);

    return () => {
      window.clearTimeout(refreshTimer);
      window.removeEventListener("load", refresh);
      responsiveMotion.revert();
      context.revert();
      if (lenis) {
        gsap.ticker.remove(tick);
        lenis.destroy();
      }
      document.documentElement.classList.remove("reduced-motion");
    };
  }, []);

  const closeMenu = () => setMenuOpen(false);
  const closeActivities = () => {
    setActivitiesOpen(false);
    window.setTimeout(() => activitiesTriggerRef.current?.focus(), 0);
  };

  return (
    <div className="site-shell" ref={shellRef}>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className={scrolled ? "site-header is-scrolled" : "site-header"}>
        <div className="nav-inner">
          <a className="brand" href="#top" onClick={closeMenu} aria-label="Tatanka Najin School home">
            <span className="brand-mark"><BuffaloLogo /></span>
            <span><strong>Tatanka Najin</strong><small>Standing Buffalo Dakota Nation</small></span>
          </a>
          <button className="menu-button" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-controls="primary-nav" aria-label={menuOpen ? "Close menu" : "Open menu"}>
            {menuOpen ? <X /> : <Menu />}
          </button>
          <nav id="primary-nav" className={menuOpen ? "primary-nav is-open" : "primary-nav"} aria-label="Primary navigation">
            <a href="#learning-supports" onClick={closeMenu}>Learning &amp; supports</a>
            <a href="#library" onClick={closeMenu}>Library</a>
            <a href="#life" onClick={closeMenu}>School life</a>
            <a className="nav-contact" href="#contact" onClick={closeMenu}>Contact <ArrowRight size={16} /></a>
          </nav>
        </div>
      </header>

      <main id="main">
        <section className="hero" id="top">
          <div className="hero-image" role="img" aria-label="Aerial view of Tatanka Najin School and the Qu'Appelle Valley" />
          <div className="hero-wash" />
          <div className="hero-cloud cloud-one" aria-hidden="true" />
          <div className="hero-cloud cloud-two" aria-hidden="true" />
          <div className="hero-hills hero-hills-back" aria-hidden="true" />
          <div className="hero-hills hero-hills-front" aria-hidden="true" />
          <Suspense fallback={<BuffaloFallback />}><PrairieScene /></Suspense>
          <div className="container hero-container">
            <div className="hero-content">
              <p className="eyebrow"><span /> Pre-K to Grade 9 · Qu'Appelle Valley</p>
              <h1>Rooted here.<br /><em>Ready for tomorrow.</em></h1>
              <p className="hero-copy">Learning on Standing Buffalo Dakota Nation, where Dakota language, culture, land, and strong academics move together.</p>
              <div className="hero-actions">
                <a className="button button-primary" href="#learning-supports">Discover our school <ArrowRight /></a>
                <a className="button button-quiet" href="tel:+13063334414"><Phone /> (306) 333-4414</a>
              </div>
            </div>
          </div>
          <a className="scroll-cue" href="#welcome" aria-label="Scroll to welcome"><span>Explore</span><ArrowDown /></a>
          <div className="hero-ribbon" aria-label="School foundations"><span>Dakota language</span><span>Culture</span><span>Learning</span><span>Community</span></div>
        </section>

        <section className="welcome section" id="welcome">
          <div className="container">
            <div className="section-label" data-reveal><span aria-hidden="true" /> Our school</div>
            <div className="welcome-grid">
              <h2 data-reveal>A school shaped by <em>place, people,</em> and possibility.</h2>
              <div className="welcome-copy" data-reveal>
                <p>Tatanka Najin School welcomes approximately 110 learners from Pre-K to Grade 9 in the scenic Qu'Appelle Valley, about 75 kilometres northeast of Regina.</p>
                <p>Saskatchewan curriculum is enriched by Dakota language and culture, helping students grow with confidence in who they are and what they can become.</p>
              </div>
            </div>
            <div className="fact-row" data-stagger aria-label="School facts">
              <div><strong>Pre-K-9</strong><span>Learning journey</span></div>
              <div><strong>~110</strong><span>Students</span></div>
              <div><strong>75 km</strong><span>Northeast of Regina</span></div>
              <div><strong>1 Nation</strong><span>Standing Buffalo Dakota</span></div>
            </div>
          </div>
        </section>

        <section className="principal section">
          <div className="container principal-grid">
            <div className="principal-visual cut-corner" data-reveal>
              <img src="/images/20210611-094436-scaled-47e4b450fc.jpg" alt="Learning at Tatanka Najin School" loading="lazy" decoding="async" data-parallax="6" />
              <span className="image-index">Message / 01</span>
            </div>
            <div className="principal-copy" data-reveal>
              <div className="section-label"><span aria-hidden="true" /> Principal's message</div>
              <blockquote>“Each student can thrive academically, socially, and emotionally.”</blockquote>
              <p>The school’s principal welcomes students, parents, staff, and visitors into a supportive learning community grounded in academic growth, curiosity, respect, and close partnership between home and school.</p>
              <details className="message-disclosure">
                <summary>Read the full message <ChevronDown aria-hidden="true" /></summary>
                <div className="message-body">
                  <p>Welcome to Tatanka Najin School.</p>
                  <p>It is with great pleasure that I extend a warm greeting to all students, parents, staff, and visitors. At Tatanka Najin School, we are dedicated to fostering an environment where each student can thrive academically, socially, and emotionally.</p>
                  <p>Our school holds a strong commitment to academic excellence, with a curriculum that is both rigorous and engaging. We nurture a love for learning that extends beyond textbooks, encouraging curiosity, critical thinking, and creativity in every student.</p>
                  <p>Equally important is the holistic development of our students. We prioritize their well-being and personal growth through a supportive and inclusive community where respect for one another is paramount.</p>
                  <p>We recognize the importance of collaboration between home and school, and encourage open communication with parents and guardians so that together we can provide the best possible support for students.</p>
                  <p>Warm regards,<br /><strong>Principal, Tatanka Najin School</strong></p>
                </div>
              </details>
            </div>
          </div>
        </section>

        <section className="horizontal-section learning-supports" id="learning-supports" data-horizontal aria-label="Learning and student supports">
          <div className="horizontal-pin">
            <div className="container horizontal-heading">
              <div className="section-label light"><span aria-hidden="true" /> Learning &amp; student supports</div>
              <h2><strong>One school day,</strong> <em>many ways of knowing.</em></h2>
              <p>Scroll to follow learning, care, and practical support through the school day.</p>
            </div>
            <div className="horizontal-viewport" data-lenis-prevent-touch>
              <div className="horizontal-track learning-supports-track">
                {learningAndSupports.map(({ number, icon: Icon, title, summary, body, image }) => (
                  <article className="path-panel cut-corner" key={title}>
                    <div className="path-panel-media"><img src={image} alt={`${title} at Tatanka Najin School`} loading="lazy" decoding="async" /></div>
                    <div className="path-panel-copy">
                      <div className="path-panel-top"><span>{number}</span><Icon aria-hidden="true" /></div>
                      <h3>{title}</h3>
                      <p>{summary}</p>
                      <details className="panel-details"><summary>Read more <ChevronDown aria-hidden="true" /></summary><p>{body}</p></details>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="library-section section" id="library">
          <div className="container library-grid">
            <div className="library-copy" data-reveal>
              <div className="section-label"><span aria-hidden="true" /> School library</div>
              <h2>A quieter place for <em>big discoveries.</em></h2>
              <p>The school library supports reading, research, collaboration, creativity, and access to digital learning resources for students, educators, and the community.</p>
              <p>It gives learners a focused place to explore information, work independently, learn together, and follow the curiosity that can begin with one good book.</p>
              <div className="library-notes" data-stagger>
                <span><Library /> Reading and research</span>
                <span><BookOpen /> Independent discovery</span>
                <span><Sparkles /> Imagination and focus</span>
              </div>
            </div>
            <div className="library-images" data-reveal>
              <figure className="library-main cut-corner"><img src="/images/stock-library.jpg" alt="Books in a welcoming school library" loading="lazy" decoding="async" data-parallax="5" /><figcaption>Reading space</figcaption></figure>
              <figure className="library-small"><img src="/images/stock-student-learning.jpg" alt="Student reading and learning independently" loading="lazy" decoding="async" /></figure>
            </div>
          </div>
        </section>

        <section className="extracurricular section" id="life">
          <div className="container extracurricular-grid">
            <div className="extra-copy" data-reveal>
              <div className="section-label"><span aria-hidden="true" /> Extra-curricular</div>
              <h2>Belonging grows <em>beyond the timetable.</em></h2>
              <p>Activities beyond the classroom give students more ways to participate, build confidence, practise teamwork, and contribute to school community. Families can connect with the office for current activities and schedules.</p>
              <button ref={activitiesTriggerRef} className="button button-dark" type="button" aria-expanded={activitiesOpen} aria-controls="activities-drawer" onClick={() => setActivitiesOpen(true)}>View current activities <ArrowRight /></button>
            </div>
            <div className="extra-gallery" data-stagger>
              <figure className="extra-tall cut-corner"><img src="/images/sbec-scaled-0797b7b134.jpg" alt="Students gathered for a school activity" loading="lazy" decoding="async" /></figure>
              <figure><img src="/images/land-based-fe96adeac4.png" alt="Students participating in land-based learning" loading="lazy" decoding="async" /></figure>
              <figure><img src="/images/20210611-091837-scaled-233b7bb3e8.jpg" alt="Student activity at Tatanka Najin School" loading="lazy" decoding="async" /></figure>
            </div>
          </div>
          <aside id="activities-drawer" className={activitiesOpen ? "activities-drawer is-open" : "activities-drawer"} aria-hidden={!activitiesOpen} aria-label="Extracurricular activity details">
            <div className="container activities-drawer-inner">
              <button ref={activitiesCloseRef} className="drawer-close" type="button" tabIndex={activitiesOpen ? 0 : -1} aria-label="Close extracurricular details" onClick={closeActivities}><X aria-hidden="true" /></button>
              <div className="drawer-intro">
                <div className="section-label light"><span aria-hidden="true" /> Beyond the classroom</div>
                <h3>Explore exciting extracurricular activities at Tatanka Najin School</h3>
                <p>At Tatanka Najin School, we believe that education extends far beyond the classroom walls. Our robust extracurricular program offers students enriching opportunities to explore their interests, develop new skills, and build lasting friendships outside of academics. Whether they are passionate about the arts, athletics, or community service, there is something for everyone to thrive and grow.</p>
              </div>
              <div className="drawer-columns">
                <div>
                  <h4>Diverse extracurricular offerings</h4>
                  <p><strong>Sports and Athletics:</strong> Engage in team sports such as basketball, volleyball, soccer, and track and field. Our coaches emphasize skill development, sportsmanship, and teamwork, fostering a competitive spirit in a supportive environment.</p>
                  <p><strong>Fine Arts:</strong> Discover creative talents through art, music, and drama programs. Students can participate in choir, band, visual arts classes, and theatrical productions, honing artistic expression and performance skills.</p>
                  <p><strong>Cultural Clubs:</strong> Celebrate diversity and cultural heritage through clubs that promote Indigenous traditions, languages, and customs. These clubs offer opportunities for learning, sharing, and preserving Indigenous cultures within our school community.</p>
                  <p><strong>Academic Clubs:</strong> Explore STEM subjects, debate, language clubs, and more while developing leadership skills and participating in competitions.</p>
                  <p><strong>Community Service:</strong> Build civic responsibility through volunteerism and projects that benefit local neighbourhoods while promoting empathy, compassion, and social awareness.</p>
                </div>
                <div>
                  <h4>Benefits of participation</h4>
                  <p><strong>Personal Growth:</strong> Extracurricular activities enhance social skills, self-confidence, and resilience. Students learn time management, responsibility, and teamwork that support future success.</p>
                  <p><strong>Holistic Development:</strong> Exploring diverse interests and talents nurtures creativity, critical thinking, emotional intelligence, and a well-rounded sense of self.</p>
                  <p><strong>Leadership Opportunities:</strong> Many activities offer leadership roles, allowing students to take initiative, inspire their peers, and make meaningful contributions to the school community.</p>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className="photo-band" aria-label="Learning in Dakota language">
          <div><img src="/images/20210611-094436-scaled-47e4b450fc.jpg" alt="Learning at Tatanka Najin School" loading="lazy" decoding="async" data-parallax="4" /></div>
          <div className="photo-band-word"><span>Wóuŋspe</span></div>
          <div><img src="/images/dji-0014-scaled-3884d76a1a.jpg" alt="Standing Buffalo Dakota Nation landscape" loading="lazy" decoding="async" data-parallax="4" /></div>
        </section>

        <section className="contact section" id="contact">
          <div className="container contact-grid">
            <div className="contact-copy" data-reveal>
              <div className="section-label light"><span aria-hidden="true" /> Connect</div>
              <h2>Come learn <em>with us.</em></h2>
              <p>For enrolment questions, transportation details, current activities, or school information, connect directly with the Tatanka Najin School office.</p>
              <div className="contact-actions"><a className="button button-primary" href="tel:+13063334414"><Phone /> Call the school</a><a className="button button-outline" href="https://maps.google.com/?q=Tatanka+Najin+School+Fort+Qu%27Appelle+SK" target="_blank" rel="noreferrer"><MapPin /> Get directions</a></div>
            </div>
            <div className="contact-panel" data-reveal>
              <div><span>Phone</span><a href="tel:+13063334414">(306) 333-4414</a></div>
              <div><span>Fax</span><p>(306) 332-2841</p></div>
              <div><span>Mailing address</span><p>Box 248<br />Fort Qu'Appelle, SK S0G 1S0</p></div>
              <div><span>Community</span><p>Standing Buffalo Dakota Nation<br />Qu'Appelle Valley, Saskatchewan</p></div>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="container footer-inner">
          <a className="brand footer-brand" href="#top"><span className="brand-mark"><BuffaloLogo /></span><span><strong>Tatanka Najin</strong><small>Standing Buffalo Dakota Nation</small></span></a>
          <p>Learning with identity, purpose, and community.</p>
          <div className="footer-links"><a href="https://fhqtc.com" target="_blank" rel="noreferrer">FHQTC</a><a href="https://www.standingbuffalodakotanation.com" target="_blank" rel="noreferrer">Standing Buffalo Dakota Nation</a></div>
          <small>© 2026 Tatanka Najin School</small>
        </div>
      </footer>
    </div>
  );
}
