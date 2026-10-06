import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, BookOpen, CalendarDays, CheckCircle2, CircleDollarSign, GraduationCap, Library, MessageCircle, Monitor, Newspaper, Search, Sparkles, Trophy, Users } from 'lucide-react';
import VoiceTeacher from './components/VoiceTeacher';
import ParentDashboard from './components/ParentDashboard';
import { supabase } from './lib/supabase';

const teachers = [
  ['Mathematics', 'O-Level + A-Level'],
  ['English Language', 'O-Level'],
  ['Physics', 'O-Level + A-Level'],
  ['Chemistry', 'O-Level + A-Level'],
  ['Biology', 'O-Level + A-Level'],
  ['Geography', 'O-Level + A-Level'],
  ['History & Political Education / History', 'O-Level + A-Level'],
  ['Entrepreneurship', 'O-Level + A-Level'],
  ['Agriculture', 'O-Level + A-Level'],
  ['ICT / Computer Studies', 'O-Level + A-Level'],
  ['Kiswahili', 'O-Level + A-Level'],
  ['CRE', 'O-Level + A-Level'],
  ['IRE', 'O-Level + A-Level'],
  ['Literature in English', 'O-Level + A-Level'],
  ['Art & Design', 'O-Level + A-Level'],
  ['Foods & Nutrition / Nutrition & Food Technology', 'O-Level + A-Level'],
  ['Physical Education', 'O-Level + A-Level'],
  ['General Paper', 'A-Level'],
];

const MockMedia = ({label, className=''}) => <div className={'mockPhoto '+className} role="img" aria-label={label}><span>{label}</span></div>;

function SatelliteMap(){
  const src='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=34.168%2C1.068%2C34.192%2C1.088&bboxSR=4326&size=1000%2C520&imageSR=4326&format=jpg&f=image';
  return <div className="satelliteMap"><img src={src} alt="Aerial view around Mount Masaba High School, Mbale" loading="lazy"/><span className="schoolMapPin">●</span><div className="schoolMapLabel">Mount Masaba High School</div></div>;
}

function getStudentGreeting(hour = new Date().getHours()) {
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function StudentAuth({ onBack, onAuthenticated }) {
  const [view, setView] = useState('login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ email:'', password:'', fullName:'', admissionNumber:'', classId:'', level:'o_level' });
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    if (!supabase) return;
    supabase.from('classes').select('id,name,level,grade_number').order('sort_order').then(({data}) => setClasses(data || []));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!supabase) return setMessage('Student services are temporarily unavailable.');
    setLoading(true); setMessage('');
    try {
      if (view === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.password });
        if (error) throw error;
        if (!data.user) throw new Error('Login could not be completed.');
        onAuthenticated();
      } else {
        if (!form.fullName.trim() || !form.admissionNumber.trim() || !form.classId) throw new Error('Please complete your name, admission number and class.');
        const { data, error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: { data: { full_name: form.fullName.trim() } }
        });
        if (error) throw error;
        if (!data.user) throw new Error('Registration could not be completed.');
        const { error: studentError } = await supabase.from('students').insert({
          profile_id: data.user.id,
          admission_number: form.admissionNumber.trim(),
          current_class_id: form.classId,
          status: 'active'
        });
        if (studentError) throw studentError;
        if (data.session) onAuthenticated();
        else setMessage('Registration submitted. Check your email to confirm your account, then log in.');
      }
    } catch (err) {
      setMessage(err?.message || 'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  return <section className="studentAuth">
    <div className="studentAuthCard">
      <button className="studentAuthBack" onClick={onBack}>← School home</button>
      <div className="studentAuthBrand"><img src="https://bpxfyvxqciktrahaxkws.supabase.co/functions/v1/public-school-logo" alt="Mount Masaba"/><div><b>Mount Masaba</b><small>STUDENT PORTAL</small></div></div>
      <span className="studentEyebrow">{view === 'login' ? 'WELCOME BACK' : 'JOIN YOUR SCHOOL SPACE'}</span>
      <h1>{view === 'login' ? 'Sign in to your learning space.' : 'Create your student account.'}</h1>
      <p>{view === 'login' ? 'Use your school email and password to continue.' : 'Your registration will be linked to your student record in Supabase.'}</p>
      <form onSubmit={submit} className="studentAuthForm">
        {view === 'register' && <><label>Full name<input value={form.fullName} onChange={e=>setForm({...form,fullName:e.target.value})} placeholder="Your full name" required/></label><label>Admission number<input value={form.admissionNumber} onChange={e=>setForm({...form,admissionNumber:e.target.value})} placeholder="e.g. MMS/2026/001" required/></label><label>Level<select value={form.level} onChange={e=>setForm({...form,level:e.target.value})}><option value="o_level">O-Level</option><option value="a_level">A-Level</option></select></label><label>Class<select value={form.classId} onChange={e=>setForm({...form,classId:e.target.value})} required><option value="">Choose your class</option>{classes.filter(x=>x.level===form.level).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label></>}
        <label>Email<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@example.com" autoComplete="email" required/></label>
        <label>Password<input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="At least 6 characters" minLength="6" autoComplete={view==='login'?'current-password':'new-password'} required/></label>
        {message && <div className="studentAuthMessage">{message}</div>}
        <button className="studentAuthSubmit" disabled={loading}>{loading ? 'Please wait…' : view === 'login' ? 'Sign in' : 'Create account'}</button>
      </form>
      <button className="studentAuthSwitch" onClick={()=>{setView(view==='login'?'register':'login');setMessage('')}}>{view==='login' ? 'New student? Create an account' : 'Already registered? Sign in'}</button>
    </div>
  </section>;
}

function StudentDashboard({ onBack }) {
  const [active, setActive] = useState('Home');
  const [student, setStudent] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  useEffect(() => { const t=window.setInterval(()=>setCurrentTime(new Date()),60000); return ()=>window.clearInterval(t); }, []);
  useEffect(() => { (async()=>{ if(!supabase) return; const {data:{user}}=await supabase.auth.getUser(); if(!user){onBack();return;} const {data}=await supabase.from('students').select('id,admission_number,current_class_id,current_stream_id,status,profiles:profile_id(full_name,avatar_path),classes:current_class_id(name,level),streams:current_stream_id(name)').eq('profile_id',user.id).maybeSingle(); setStudent(data); setProfileLoading(false); })(); }, [onBack]);
  const greeting = currentTime.getHours() >= 5 && currentTime.getHours() < 12 ? 'Good morning' : currentTime.getHours() >= 12 && currentTime.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const studentName = student?.profiles?.full_name || 'Student';
  const className = student?.classes?.name || 'Class pending';
  const levelName = student?.classes?.level === 'a_level' ? 'A-Level' : student?.classes?.level === 'o_level' ? 'O-Level' : 'Level pending';
  const streamName = student?.streams?.name || 'Stream pending';
  const nav = ['Home','Learning','AI Teachers','Tasks','Results','Profile'];
  const subjects = [
    ['Mathematics','Continue learning','—'],
    ['English Language','Next lesson','—'],
    ['Biology','Revision ready','—'],
    ['Chemistry','Practice set','—']
  ];
  const actions = [
    ['AI Teachers','Ask a subject teacher','Sparkles'],
    ['My Learning','Continue your courses','BookOpen'],
    ['Assignments','See what is due','CheckCircle2'],
    ['Timetable','Know your next class','CalendarDays']
  ];
  if(active !== 'Home'){
    const labels={Learning:'Your learning space', 'AI Teachers':'Your AI teacher room', Tasks:'Your tasks', Results:'Your academic record', Profile:'Your student profile'};
    return <section className="studentPortal studentSubpage">
      <header className="studentTopbar"><button className="studentBack" onClick={onBack}>← <span>School home</span></button><div className="studentSchoolMark"><img src="https://bpxfyvxqciktrahaxkws.supabase.co/functions/v1/public-school-logo" alt=""/><b>Mount Masaba</b></div><button className="studentIconBtn" onClick={()=>setActive('Home')}>⌂</button></header>
      <div className="studentSubpageHero"><span className="studentEyebrow">STUDENT SPACE</span><h1>{labels[active]}</h1><p>Everything here is designed around you, your learning and your next step.</p></div>
      <div className="studentPlaceholderGrid">{actions.map(([title,desc,icon])=><button key={title} onClick={()=>setActive(title==='AI Teachers'?'AI Teachers':title==='My Learning'?'Learning':title==='Assignments'?'Tasks':'Home')}><span className="studentActionIcon">{icon==='Sparkles'?'✦':icon==='BookOpen'?'▣':icon==='CheckCircle2'?'✓':'◷'}</span><b>{title}</b><small>{desc}</small><ArrowRight size={15}/></button>)}</div>
      <div className="studentEmptyState"><span>✦</span><h3>Your {active.toLowerCase()} will live here</h3><p>When your student account is connected, this space will load your personal school data automatically.</p><button onClick={()=>setActive('Home')}>Back to my dashboard</button></div>
    </section>;
  }
  return <section className="studentPortal">
    <header className="studentTopbar">
      <button className="studentBack" onClick={onBack}>← <span>School home</span></button>
      <div className="studentSchoolMark"><img src="https://bpxfyvxqciktrahaxkws.supabase.co/functions/v1/public-school-logo" alt="Mount Masaba High School"/><b>Mount Masaba</b><small>HIGH SCHOOL</small></div>
      <div className="studentTopActions"><button className="studentIconBtn" aria-label="Notifications">♢</button><button className="studentAvatar">S</button></div>
    </header>
    <main className="studentMain">
      <section className="studentWelcome">
        <div><span className="studentEyebrow">MY LEARNING SPACE</span><h1>{greeting}, <strong>{studentName}</strong> 👋</h1><p>This is your space. Learn at your pace, track your progress, and always know what comes next.</p></div>
        <div className="studentIdentity"><div className="studentAvatarLarge">S</div><div><b>{studentName}</b><span>{student?.admission_number || 'Student ID pending'}</span><small>{className} • {levelName} • {streamName}</small></div><button onClick={()=>setActive('Profile')}>View profile</button></div>
      </section>

      <section className="studentFocusCard">
        <div className="studentFocusGlow"></div><div className="studentFocusCopy"><span className="studentEyebrow">YOUR NEXT STEP</span><h2>Keep your learning moving.</h2><p>Pick up where you stopped, ask your AI teacher for help, or check today's school plan.</p><button onClick={()=>setActive('Learning')}>Continue learning <ArrowRight size={16}/></button></div>
        <div className="studentProgressRing"><div><b>—</b><span>progress</span></div></div>
      </section>

      <section className="studentStats">
        <article><span>LEARNING STREAK</span><b>—</b><small>Start your streak today</small></article>
        <article><span>ASSIGNMENTS</span><b>—</b><small>Your due work will appear here</small></article>
        <article><span>ATTENDANCE</span><b>—</b><small>Waiting for your school record</small></article>
        <article><span>ACADEMIC SCORE</span><b>—</b><small>Your latest results will appear here</small></article>
      </section>

      <section className="studentSectionHead"><div><span className="studentEyebrow">QUICK ACCESS</span><h2>What do you want to do?</h2></div><span className="studentPersonalBadge">Made for you</span></section>
      <section className="studentActions">{actions.map(([title,desc,icon])=><button key={title} onClick={()=>setActive(title==='AI Teachers'?'AI Teachers':title==='My Learning'?'Learning':title==='Assignments'?'Tasks':'Learning')}><span className="studentActionIcon">{icon==='Sparkles'?'✦':icon==='BookOpen'?'▣':icon==='CheckCircle2'?'✓':'◷'}</span><div><b>{title}</b><small>{desc}</small></div><ArrowRight size={16}/></button>)}</section>

      <section className="studentTwoCol">
        <div className="studentPanel">
          <div className="studentPanelHead"><div><span className="studentEyebrow">MY SUBJECTS</span><h2>Your learning shelf</h2></div><button onClick={()=>setActive('Learning')}>View all</button></div>
          <div className="studentSubjectList">{subjects.map(([name,status,score])=><button key={name} onClick={()=>setActive('Learning')}><span className="studentSubjectIcon">{name[0]}</span><div><b>{name}</b><small>{status}</small></div><strong>{score}</strong><ArrowRight size={14}/></button>)}</div>
        </div>
        <div className="studentPanel studentAiFeature">
          <span className="studentAiOrb">✦</span><span className="studentEyebrow">YOUR AI TEACHERS</span><h2>Never get stuck alone.</h2><p>Ask a subject-specific AI teacher to explain a topic, walk you through a question, or create practice for you.</p><div className="studentTeacherPills"><span>Math</span><span>Physics</span><span>Biology</span><span>+ 15 more</span></div><button onClick={()=>setActive('AI Teachers')}>Meet my AI teachers <ArrowRight size={16}/></button>
        </div>
      </section>

      <section className="studentTwoCol studentLower">
        <div className="studentPanel"><div className="studentPanelHead"><div><span className="studentEyebrow">TODAY</span><h2>Your school day</h2></div><button onClick={()=>setActive('Learning')}>Timetable</button></div><div className="studentTimeline"><div><b>08:00</b><span><strong>Mathematics</strong><small>Classroom • Learning</small></span><em>Next</em></div><div><b>10:00</b><span><strong>English Language</strong><small>Classroom • Learning</small></span><em>Later</em></div><div><b>14:00</b><span><strong>Inter-Class Activity</strong><small>School field • Activity</small></span><em>Today</em></div></div></div>
        <div className="studentPanel studentMotivation"><span>YOUR SPACE • YOUR PACE</span><h2>Small progress every day becomes something big.</h2><p>Show up. Ask questions. Practice. Improve.</p><button onClick={()=>setActive('Learning')}>Start a learning session <ArrowRight size={15}/></button></div>
      </section>
    </main>
    <nav className="studentMobileNav">{nav.map(x=><button key={x} className={active===x?'active':''} onClick={()=>setActive(x)}><span>{x==='Home'?'⌂':x==='Learning'?'▣':x==='AI Teachers'?'✦':x==='Tasks'?'✓':x==='Results'?'◒':'○'}</span><small>{x}</small></button>)}</nav>
  </section>;
}

function App() { // Mount Masaba human school homepage
  const [mode,setMode]=useState('home'),[portalRole,setPortalRole]=useState('student'),[studentAuthed,setStudentAuthed]=useState(false),[level,setLevel]=useState('O-Level'),[selected,setSelected]=useState(0),[dbStatus,setDbStatus]=useState('checking'),[portalTab,setPortalTab]=useState('Dashboard'),[slide,setSlide]=useState(0);
  const [site,setSite]=useState({gallery:[],news:[],events:[],info:[],contacts:[]});
  const [menuOpen,setMenuOpen]=useState(false);
  const fallbackSlides=[{title:'Welcome to Mount Masaba',accent:'High School',kicker:'WELCOME TO MOUNT MASABA',text:'Knowledge, discipline and excellence — growing learners for a better future.'},{title:'Learn. Grow.',accent:'Lead.',kicker:'OUR SCHOOL COMMUNITY',text:'A caring coeducational learning community in Mbale, at the base of Mt. Elgon.'},{title:'School Life',accent:'Beyond the Classroom',kicker:'INTER-CLASS SPORTS & ACTIVITIES',text:'Learning, friendship, leadership and healthy competition across classes.'}];
  useEffect(()=>{fetch('/api/public-home').then(r=>r.json()).then(data=>{setSite(data);setDbStatus(data?.connected?'connected':'offline')}).catch(()=>setDbStatus('offline'))},[]);
  const media=(path)=>{if(!path)return '';if(/^https?:\/\//i.test(path))return path;const p=path.replace(/^\/+/,'');if(p.startsWith('storage/v1/'))return 'https://bpxfyvxqciktrahaxkws.supabase.co/'+p;return 'https://bpxfyvxqciktrahaxkws.supabase.co/storage/v1/object/public/Mount%20Masaba%20High%20School/'+p.split('/').map(encodeURIComponent).join('/')};
  const gallery=site.gallery||[];
  const slides=[
    {image:'https://bpxfyvxqciktrahaxkws.supabase.co/storage/v1/object/public/Mount%20Masaba%20High%20School/Background/IMG-20260929-WA0064.jpg',title:'Welcome to Mount Masaba',accent:'High School',kicker:'WELCOME TO MOUNT MASABA',text:'Nurturing well-rounded learners, shaping future leaders, and building a brighter tomorrow.'},
    {image:'https://bpxfyvxqciktrahaxkws.supabase.co/storage/v1/object/public/Mount%20Masaba%20High%20School/Background/IMG-20260929-WA0054.jpg',title:'Learn. Grow.',accent:'Lead.',kicker:'OUR SCHOOL COMMUNITY',text:'A caring coeducational learning community in Mbale, at the base of Mt. Elgon.'},
    {image:'https://bpxfyvxqciktrahaxkws.supabase.co/storage/v1/object/public/Mount%20Masaba%20High%20School/Background/IMG-20260929-WA0059(1).jpg',title:'School Life',accent:'Beyond the Classroom',kicker:'INTER-CLASS SPORTS & ACTIVITIES',text:'Learning, friendship, leadership and healthy competition across classes.'}
  ];
  useEffect(()=>{if(slide>=slides.length)setSlide(0)},[slides.length,slide]);
  useEffect(()=>{const t=window.setInterval(()=>setSlide(s=>(s+1)%slides.length),6500);return()=>window.clearInterval(t)},[slides.length]);
  const visible=useMemo(()=>teachers.filter(([,scope])=>scope.includes(level)||scope.includes('O-Level + A-Level')),[level]);
  const features=[['Dashboard','Overview'],['My Learning','Classes'],['AI Teachers','18 AI'],['Assignments','Work'],['Quizzes','Practice'],['Results','Grades'],['Attendance','Record'],['Timetable','Schedule'],['Materials','Library'],['Announcements','News'],['Profile','Account']];
  const go=(id)=>document.getElementById(id)?.scrollIntoView({behavior:'smooth'});
  const renderFeature=()=> <><div className="featureIntro"><div><span className="pill">{portalTab}</span><h3>{portalTab==='AI Teachers'?'18 subject AI teachers':'School portal'}</h3><p>{portalTab==='AI Teachers'?'Choose a teacher for explanations, guided practice, quizzes and revision.':'Your school data, learning tools and records will appear here.'}</p></div><span className="connectionBadge">{dbStatus==='connected'?'Supabase ready':'Data connection pending'}</span></div>{portalTab==='AI Teachers'?<><div className="levelSwitch compact"><button className={level==='O-Level'?'active':''} onClick={()=>{setLevel('O-Level');setSelected(0)}}>O-Level</button><button className={level==='A-Level'?'active':''} onClick={()=>{setLevel('A-Level');setSelected(0)}}>A-Level</button></div><div className="teacherGrid">{visible.map(([name,scope],i)=><button key={name} className={selected===i?'teacher selected':'teacher'} onClick={()=>setSelected(i)}><span className="teacherIcon">AI</span><span><strong>{name}</strong><small>{scope}</small></span></button>)}</div><div className="aiPanel"><div><span className="pill">Selected teacher</span><h3>{visible[selected]?.[0]||'Choose a teacher'}</h3><p>Curriculum-aware lessons and practice will use the selected level and learner progress.</p></div><VoiceTeacher teacher={visible[selected]?.[0]||'teacher'} level={level}/></div></>:<div className="emptyFeature"><strong>{portalTab}</strong><span>Secure school data and learning features will load here through Supabase.</span></div>}</>;
  return <main className="shell">

    {mode==='home'?<>
      <section className="refTop"><span>✉ info@mountmasabahigh.ac.ug</span><span>☎ +256 772 123 456</span><span>Mbale, Eastern Uganda • Mt. Elgon</span></section>
      <header className="refHeader"><div className="refBrand"><img src="https://bpxfyvxqciktrahaxkws.supabase.co/functions/v1/public-school-logo" alt="Mount Masaba High School logo"/><div><b>Mount Masaba</b><strong>High School</strong></div></div><nav><button onClick={()=>go('about')}>About</button><button onClick={()=>go('academics')}>Academics</button><button onClick={()=>go('life')}>School Life</button><button onClick={()=>go('admissions')}>Admissions</button><button onClick={()=>go('contact')}>Contact</button><a className="adminSideLink" href="/admin.html">Admin Console</a></nav><button className="refMenu" aria-label="Open menu" onClick={()=>setMenuOpen(true)}>☰</button></header>
      {menuOpen&&<div className="mobileMenuOverlay" role="dialog" aria-label="School menu"><button className="mobileMenuBackdrop" aria-label="Close menu" onClick={()=>setMenuOpen(false)}></button><aside className="mobileMenuPanel"><div className="mobileMenuHead"><div className="refBrand"><img src="https://bpxfyvxqciktrahaxkws.supabase.co/functions/v1/public-school-logo" alt="Mount Masaba High School logo"/><div><b>Mount Masaba</b><strong>High School</strong></div></div><button className="mobileMenuClose" onClick={()=>setMenuOpen(false)} aria-label="Close menu">×</button></div><div className="mobileMenuLinks"><button onClick={()=>{setMenuOpen(false);go('about')}}>About Us</button><button onClick={()=>{setMenuOpen(false);go('academics')}}>Academics</button><button onClick={()=>{setMenuOpen(false);go('admissions')}}>Admissions</button><button onClick={()=>{setMenuOpen(false);go('life')}}>School Life</button><button onClick={()=>{setMenuOpen(false);go('location')}}>Location</button><button onClick={()=>{setMenuOpen(false);go('contact')}}>Contact</button><button onClick={()=>{setMenuOpen(false);go('news')}}>News & Events</button><button onClick={()=>{setMenuOpen(false);go('gallery')}}>Gallery</button></div><div className="mobilePortalLinks"><button className="mobileStudentPortal" onClick={()=>{setMenuOpen(false);setPortalRole('student');setMode('portal')}}>Student Portal <ArrowRight size={15}/></button><button className="mobileParentPortal" onClick={()=>{setMenuOpen(false);setPortalRole('parent');setMode('portal')}}>Parent Portal <ArrowRight size={15}/></button></div></aside></div>}

      <section className="refHero">
        <div className="refHeroMedia">{slides[slide].image?<img src={slides[slide].image} alt={slides[slide].title}/>:<MockMedia label="Mount Elgon campus photo"/>}<div className="refHeroShade"/></div>
        <div className="refHeroContent"><span className="refKicker">WELCOME TO MOUNT MASABA</span><h2>{slides[slide].title}<br/><strong>{slides[slide].accent}</strong></h2><p>Nurturing well-rounded learners, shaping future leaders, and building a brighter tomorrow.</p><button onClick={()=>go('about')}>Discover Our School <ArrowRight size={15}/></button></div>
        <div className="refHeroDots">{slides.map((_,i)=><button key={i} className={i===slide?'active':''} onClick={()=>setSlide(i)} aria-label={'Hero slide '+(i+1)}/>)}</div>
      </section>

      <section className="refQuick"><button onClick={()=>{setPortalRole('student');setMode('portal')}}><span>🎓</span><b>Student Portal</b><small>Access your results, fees and more</small><ArrowRight size={15}/></button><button onClick={()=>go('academics')}><span>📖</span><b>Academics</b><small>Subjects, curriculum and timetables</small><ArrowRight size={15}/></button><button onClick={()=>go('admissions')}><span>👥</span><b>Admissions</b><small>Join our school</small><ArrowRight size={15}/></button><button onClick={()=>go('contact')}><span>✉</span><b>Contact</b><small>Get in touch with us</small><ArrowRight size={15}/></button></section>

      <section id="about" className="refSection refAbout"><div className="refCopy"><span className="refKicker">ABOUT OUR SCHOOL</span><h2>A school with a story, a community and a future.</h2><p>Mount Masaba High School is located in the town of Mbale, in eastern Uganda, at the base of Mt. Elgon. Founded in 2000 by a group of young professionals and business people from the Mbale area, the school is a coeducational institution with day and boarding options.</p><button onClick={()=>go('values')}>Learn More <ArrowRight size={14}/></button></div><div className="refImage"><img src="https://bpxfyvxqciktrahaxkws.supabase.co/storage/v1/object/public/Mount%20Masaba%20High%20School/School%20campus%20photo/IMG-20260929-WA0059%281%29.jpg" alt="Mount Masaba High School campus" loading="lazy"/></div><div className="refStats"><span><b>20+</b>Years of<br/>Excellence</span><span><b>1,000+</b>Students</span><span><b>100+</b>Dedicated<br/>Staff</span></div></section>

      <section className="refSection refQuickAccess"><div className="refSectionHead"><span className="refKicker">QUICK ACCESS</span><h2>Everything you need, one tap away.</h2></div><div className="refAccessGrid"><button onClick={()=>{setPortalRole('student');setMode('portal')}}><span>🎓</span><div><b>Student Portal</b><small>Access your results, fees and more</small></div><ArrowRight/></button><button onClick={()=>go('academics')}><span>📚</span><div><b>Academics</b><small>Subjects, curriculum and timetables</small></div><ArrowRight/></button><button onClick={()=>go('admissions')}><span>👥</span><div><b>Admissions</b><small>Join our school</small></div><ArrowRight/></button><button onClick={()=>go('contact')}><span>☎</span><div><b>Contact</b><small>Get in touch with us</small></div><ArrowRight/></button></div></section>

      <section className="refSection refWhy"><div className="refSectionHead"><span className="refKicker">WHY CHOOSE MOUNT MASABA?</span><h2>Learning that prepares students for life.</h2></div><div className="refWhyGrid"><article><span>🎓</span><b>Quality Education</b><p>Strong academic foundations and holistic development.</p></article><article><span>👥</span><b>Supportive Community</b><p>Caring teachers and a friendly learning environment.</p></article><article><span>★</span><b>Moral & Cultural Values</b><p>Discipline, respect and integrity.</p></article><article><span>▣</span><b>Modern Facilities</b><p>ICT resources and well-equipped classrooms.</p></article><article><span>◎</span><b>International Friendships</b><p>Students from across East Africa and beyond.</p></article></div><div className="refWideImage">{(()=>{const g=gallery.find(x=>x.image_path&&/student|community|why/i.test((x.album||'')+' '+(x.title||'')));return g?<img src={media(g.image_path)} alt={g.caption||'Mount Masaba students'} loading="lazy"/>:<MockMedia label="Students and teachers photo"/>})()}</div></section>

      <section id="academics" className="refSection"><div className="refSectionHead"><span className="refKicker">OUR ACADEMIC PROGRAMS</span><h2>Clear pathways from O-Level to A-Level.</h2></div><div className="refTabs"><button className={level==='O-Level'?'active':''} onClick={()=>setLevel('O-Level')}>O-Level</button><button className={level==='A-Level'?'active':''} onClick={()=>setLevel('A-Level')}>A-Level</button></div><div className="refAcademicList"><h3>{level} Subjects</h3>{(level==='O-Level'?['Mathematics','English Language','Biology','Chemistry','Physics','History','Geography','Religious Education','Computer Studies']:['Mathematics','Physics','Chemistry','Biology','Geography','History','Economics','Entrepreneurship','Literature in English','General Paper']).map(x=><span key={x}>◉ {x}</span>)}</div><button className="refYellow" onClick={()=>{setPortalRole('student');setMode('portal')}}>View All Subjects <ArrowRight size={15}/></button></section>

      <section className="refSection refOA"><div className="refSectionHead"><span className="refKicker">O-LEVEL & A-LEVEL</span><h2>Two pathways. One strong foundation.</h2></div><div className="refOAGrid"><article><div className="refCardImage">{(()=>{const g=gallery.find(x=>x.image_path&&/o-level|olevel|lower|secondary/i.test((x.album||'')+' '+(x.title||'')));return g?<img src={media(g.image_path)} alt="O-Level students" loading="lazy"/>:<MockMedia label="O-Level classroom photo"/>})()}</div><b>O-Level</b><span>Ordinary Level</span><p>Core and elective subjects.</p><button onClick={()=>setLevel('O-Level')}>Learn More <ArrowRight/></button></article><article><div className="refCardImage">{(()=>{const g=gallery.find(x=>x.image_path&&/a-level|alevel|upper/i.test((x.album||'')+' '+(x.title||'')));return g?<img src={media(g.image_path)} alt="A-Level students" loading="lazy"/>:<MockMedia label="A-Level classroom photo"/>})()}</div><b>A-Level</b><span>Advanced Level</span><p>Specialized subjects for university preparation.</p><button onClick={()=>setLevel('A-Level')}>Learn More <ArrowRight/></button></article></div></section>

      <section id="life" className="refSection"><div className="refSectionHead"><span className="refKicker">LIFE AT MOUNT MASABA</span><h2>We nurture the whole student.</h2></div><div className="refPills"><span>Academics</span><span>Sports</span><span>Culture</span><span>Leadership</span></div><div className="refLifeImage">{(()=>{const g=gallery.find(x=>x.image_path&&/sport|life|activity/i.test((x.album||'')+' '+(x.title||'')));return g?<img src={media(g.image_path)} alt="School life" loading="lazy"/>:<MockMedia label="Student life photo"/>})()}</div><p className="refLead">Our vibrant school life helps learners grow in confidence, creativity and character.</p><button className="refYellow">Explore School Life <ArrowRight/></button></section>

      <section className="refSection"><div className="refSectionHead"><span className="refKicker">OUR FACILITIES</span><h2>Spaces that support learning.</h2></div><div className="refFacilityGrid">{[['Classrooms',/classroom|class room/i],['Science Laboratory',/science|chemistry|physics|biology|laborator/i],['ICT Laboratory',/ict|computer|technology|information technology/i],['Library',/library/i],['Hostels',/hostel|boarding|dorm/i],['Sports Fields',/sport|field|football|basketball|volleyball/i]].map(([label,pattern])=>{const exactImage=label==='Science Laboratory'?'Laboratories/Ict.jpg':label==='ICT Laboratory'?'Laboratories/Sice.jpg':label==='Library'?'Library/IMG-20260929-WA0055 (1).jpg':label==='Sports Fields'?'Sports fields/4d45098847f7da0d36dc609b8e1b40b3.png':null;const g=gallery.find(y=>y.image_path&&pattern.test(((y.album||'')+' '+(y.title||'')+' '+(y.caption||''))));const src=exactImage?media(exactImage):g?media(g.image_path):null;return <article key={label}>{src?<img src={src} alt={label} loading="lazy"/>:<MockMedia label={label+' photo'}/>}<b>{label}</b></article>})}</div></section>

      <section className="refSection"><div className="refSectionHead"><span className="refKicker">LATEST NEWS</span><h2>What's happening at Mount Masaba.</h2></div><div className="refNewsList">{(site.news||[]).slice(0,3).map(n=><article key={n.id}>{n.cover_image_path?<img src={media(n.cover_image_path)} alt="" loading="lazy"/>:<MockMedia label="News photo"/>}<div><b>{n.title}</b><small>{n.published_at?new Date(n.published_at).toLocaleDateString():'School update'}</small><p>{n.excerpt||''}</p></div></article>)}{!(site.news||[]).length&&['Inter-Class Sports Competition','2026 Admissions Now Open','School Renovation Update'].map(x=><article key={x}><MockMedia label="News photo"/><div><b>{x}</b><small>School update</small><p>Published school news will appear here.</p></div></article>)}</div><button className="refDarkBtn">View All News <ArrowRight/></button></section>

      <section className="refSection"><div className="refSectionHead"><span className="refKicker">UPCOMING EVENTS</span><h2>Mark your calendar.</h2></div><div className="refEvents">{(site.events||[]).slice(0,3).map((e,i)=><article key={e.id}><b>{new Date(e.starts_at).getDate().toString().padStart(2,'0')}</b><div><strong>{e.title}</strong><small>{e.location||'Mount Masaba High School'}</small></div></article>)}{!(site.events||[]).length&&['School Open Day','Inter-Class Sports Finals','Alumni Visit'].map((x,i)=><article key={x}><b>{['15 MAY','22 MAY','05 JUN'][i]}</b><div><strong>{x}</strong><small>School calendar event</small></div></article>)}</div><button className="refDarkBtn">View All Events <ArrowRight/></button></section>

      <section id="admissions" className="refSection refAdmission"><div className="refSectionHead"><span className="refKicker">JOIN OUR SCHOOL</span><h2>Start your journey at Mount Masaba.</h2></div><div className="refAdmissionImage">{(()=>{const g=gallery.find(x=>x.image_path&&/admission|apply/i.test((x.album||'')+' '+(x.title||'')));return g?<img src={media(g.image_path)} alt="Admissions" loading="lazy"/>:<MockMedia label="Admissions photo"/>})()}</div><div className="refAdmissionBody"><h3>Admission Requirements</h3><p>✓ Completed previous level<br/>✓ Birth certificate or ID<br/>✓ Recent passport photos<br/>✓ Good conduct record where applicable</p><button className="refYellow">Apply Now <ArrowRight/></button><a>↓ Download Admission Form</a></div></section>

      <section className="refSection refScholar"><div className="refSectionHead"><span className="refKicker">SCHOLARSHIPS & SUPPORT</span><h2>Every talented learner deserves a chance.</h2></div><div className="refScholarGrid"><div>{(()=>{const g=gallery.find(x=>x.image_path&&/scholar|support/i.test((x.album||'')+' '+(x.title||'')));return g?<img src={media(g.image_path)} alt="Scholarship support" loading="lazy"/>:<MockMedia label="Scholarship student photo"/>})()}</div><div><p>Mount Masaba has a history of community support and scholarships helping deserving learners access secondary education.</p><button className="refDarkBtn">Learn More <ArrowRight/></button></div></div></section>

      <section id="location" className="refSection refLocation"><div className="refSectionHead"><span className="refKicker">OUR LOCATION</span><h2>At the base of Mt. Elgon.</h2></div><div className="refLocationImage">{(()=>{const g=gallery.find(x=>x.image_path&&/location|elgon|mbale/i.test((x.album||'')+' '+(x.title||'')));return g?<img src={media(g.image_path)} alt="Mbale and Mt. Elgon" loading="lazy"/>:<MockMedia label="Mt. Elgon and Mbale photo"/>})()}</div><div className="refMapCard"><p>📍 Mbale, Eastern Uganda</p><small>At the base of Mt. Elgon.</small><SatelliteMap/></div><div className="locationMapActions"><a className="refDarkBtn inlineBtn locationDirections" href="https://www.google.com/maps/dir/?api=1&destination=1.0771%2C34.18015&travelmode=driving" target="_blank" rel="noreferrer">Get Directions <ArrowRight/></a></div></section>

      <section className="refSection"><div className="refSectionHead"><span className="refKicker">GALLERY</span><h2>Moments from Mount Masaba.</h2></div><div className="refGallery">{gallery.filter(x=>x.image_path).slice(0,6).map(g=><img key={g.id} src={media(g.image_path)} alt={g.caption||'Mount Masaba High School'} loading="lazy"/>)}{!gallery.filter(x=>x.image_path).length&&[1,2,3,4,5,6].map(i=><MockMedia key={i} label="School photo placeholder"/>)}</div><button className="refDarkBtn">View More Photos <ArrowRight/></button></section>

      <section id="values" className="refSection refValues"><div className="refSectionHead"><span className="refKicker">OUR MOTTO</span><h2>Striving for the Utmost</h2></div><div className="refValuesGrid"><div><b>♢</b><span>Discipline</span><b>★</b><span>Excellence</span><b>✦</b><span>Integrity</span><b>♥</b><span>Service</span></div><div><p>“Striving for the Utmost.”</p><small>— Mount Masaba High School</small></div></div></section>

      <section id="contact" className="refSection refContact"><div className="refSectionHead"><span className="refKicker">CONTACT US</span><h2>We'd love to hear from you.</h2></div><div className="refContactGrid"><div><p>📍 Location<br/><b>Mbale, Eastern Uganda</b></p><p>☎ Phone<br/><b>+256 772 123 456</b></p><p>✉ Email<br/><b>info@mountmasabahigh.ac.ug</b></p></div><form onSubmit={e=>e.preventDefault()}><input placeholder="Name"/><input placeholder="Email"/><textarea placeholder="Message"/><button className="refDarkBtn">Send Message <ArrowRight/></button></form></div></section>

      <section className="refSection refNewsletter"><div><span className="refKicker">STAY CONNECTED</span><h2>Get the latest news, events and updates.</h2><form onSubmit={e=>e.preventDefault()}><input placeholder="Your email address"/><button className="refYellow">Subscribe</button></form></div><div>{(()=>{const g=gallery.find(x=>x.image_path&&/campus|home|location/i.test((x.album||'')+' '+(x.title||'')));return g?<img src={media(g.image_path)} alt="Mount Masaba campus" loading="lazy"/>:<MockMedia label="Mt. Elgon campus photo"/>})()}</div></section>

      <section className="refFooter"><div className="refFooterBrand"><img src="https://bpxfyvxqciktrahaxkws.supabase.co/functions/v1/public-school-logo" alt="Mount Masaba logo"/><b>Mount Masaba<br/>High School</b></div><div><b>Quick Links</b><a>Home</a><a>About Us</a><a>Academics</a><a>Admissions</a><a>News & Events</a><a>Gallery</a><a>Contact</a></div><div><b>Follow Us</b><p>● 𝕏 ▶ ◎</p></div><small>© 2026 Mount Masaba High School. All rights reserved.</small></section>

      <section className="refMobileMenu"><span>☰</span><b>Mobile menu</b><small>Home • About • Academics • Admissions • News • Gallery • Contact</small></section>
    </>:portalRole==='parent'?<ParentDashboard onBack={()=>setMode('home')}/>:studentAuthed?<StudentDashboard onBack={()=>{setStudentAuthed(false);setMode('home')}}/>:<StudentAuth onBack={()=>setMode('home')} onAuthenticated={()=>setStudentAuthed(true)}/>}
    <footer><div><b>Mount Masaba High School</b><span>Striving for the Utmost</span></div><small>Mbale, Eastern Uganda • At the base of Mt. Elgon</small></footer>
  </main>;
}
export default App;