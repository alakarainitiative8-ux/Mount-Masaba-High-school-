import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, Bell, BookOpen, CalendarDays, CheckCircle2, ChevronDown,
  CircleDollarSign, FileText, Heart, Home, LogOut, MessageCircle,
  MoreHorizontal, RefreshCw, Send, Sparkles, TrendingUp, WalletCards,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type ParentDashboardProps = { onBack?: () => void };
type Child = {
  id: string;
  profile_id: string;
  name: string;
  initials: string;
  level: string;
  track: string;
  classId: string | null;
  streamId: string | null;
};
type SubjectRow = { id: string; name: string; score: number; progress: number };
type AssignmentRow = { id: string; title: string; due_at: string; subject: string; status: string; score?: number | null };
type TimetableRow = { id: string; start_time: string; end_time: string; room: string | null; subject: string };
type MessageRow = { id: string; subject: string; body: string; created_at: string; read_at: string | null };
type FeeRow = { id: string; student_id: string; total_amount: number; amount_paid: number; currency: string; due_date: string | null; status: string };
type NoticeRow = { id: string; title: string; body: string; published_at: string | null };
type AttendanceRow = { id: string; attendance_date: string; status: string; note: string | null };
type MaterialRow = { id: string; title: string; description: string | null; bucket_path: string; mime_type: string | null; class_subject_id: string };
type ReportCardRow = { id: string; average_score: number | null; position: number | null; class_size: number | null; teacher_comment: string | null; head_comment: string | null; pdf_path: string | null; published_at: string | null };

const logoUrl = 'https://bpxfyvxqciktrahaxkws.supabase.co/functions/v1/public-school-logo';

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase() || 'PA';
}
function formatTime(value: string) {
  return value?.slice(0, 5) || '';
}
function formatDate(value?: string | null) {
  if (!value) return 'No date';
  return new Intl.DateTimeFormat('en-UG', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}
function money(value: number, currency = 'UGX') {
  return new Intl.NumberFormat('en-UG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value || 0);
}

export default function ParentDashboard({ onBack }: ParentDashboardProps) {
  const [sessionReady, setSessionReady] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerStudentId, setRegisterStudentId] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerMessage, setRegisterMessage] = useState('');
  const [pendingApproval, setPendingApproval] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dataError, setDataError] = useState('');
  const [parentName, setParentName] = useState('Parent');
  const [parentId, setParentId] = useState<string | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [childId, setChildId] = useState('');
  const [active, setActive] = useState('Home');
  const [showChildren, setShowChildren] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [fees, setFees] = useState<FeeRow[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [timetable, setTimetable] = useState<TimetableRow[]>([]);
  const [notices, setNotices] = useState<NoticeRow[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRow[]>([]);
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [reportCards, setReportCards] = useState<ReportCardRow[]>([]);
  const [liveNotification, setLiveNotification] = useState('');
  const [materialUrls, setMaterialUrls] = useState<Record<string,string>>({});
  const [attendancePct, setAttendancePct] = useState<number | null>(null);
  const [average, setAverage] = useState<number | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageStatus, setMessageStatus] = useState('');
  const [assistantQuestion, setAssistantQuestion] = useState('');
  const [assistantAnswer, setAssistantAnswer] = useState('');
  const [assistantBusy, setAssistantBusy] = useState(false);
  const [assistantError, setAssistantError] = useState('');

  const child = useMemo(() => children.find(c => c.id === childId) || children[0], [children, childId]);

  const loadPortal = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setDataError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSessionReady(false); return; }
      setSessionReady(true);
      setUserEmail(user.email || '');

      const [{ data: profile, error: profileError }, { data: parent, error: parentError }] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
        supabase.from('parents').select('id').eq('profile_id', user.id).maybeSingle()
      ]);
      if (profileError) throw profileError;
      if (parentError) throw parentError;
      if (!parent) {
        setPendingApproval(true);
        return;
      }
      setPendingApproval(false);
      setParentId(parent.id);
      setParentName(profile?.full_name || 'Parent');

      const { data: links, error: linkError } = await supabase
        .from('parent_students')
        .select('student_id, relationship, is_primary')
        .eq('parent_id', parent.id)
        .order('is_primary', { ascending: false });
      if (linkError) throw linkError;

      const ids = (links || []).map(x => x.student_id);
      if (!ids.length) {
        setChildren([]); setChildId(''); setSubjects([]); setAssignments([]); setTimetable([]);
        setAttendancePct(null); setAverage(null); setProgress(null);
        return;
      }

      const [{ data: students, error: studentsError }, { data: childProfiles, error: childProfilesError }] = await Promise.all([
        supabase.from('students').select('id,profile_id,current_class_id,current_stream_id').in('id', ids),
        supabase.from('profiles').select('id,full_name').in('id', ids.length ? [] : ids)
      ]);
      if (studentsError) throw studentsError;
      if (childProfilesError) throw childProfilesError;

      const profileIds = (students || []).map(s => s.profile_id).filter(Boolean);
      const { data: profiles } = profileIds.length
        ? await supabase.from('profiles').select('id,full_name').in('id', profileIds)
        : { data: [] as any[] };
      const profileMap = new Map((profiles || []).map(p => [p.id, p.full_name]));
      const childList: Child[] = (students || []).map(s => {
        const name = profileMap.get(s.profile_id) || 'Student';
        return {
          id: s.id, profile_id: s.profile_id, name, initials: initials(name),
          level: '', track: '', classId: s.current_class_id, streamId: s.current_stream_id
        };
      });

      const classIds = [...new Set(childList.map(c => c.classId).filter(Boolean))] as string[];
      const { data: classes } = classIds.length ? await supabase.from('classes').select('id,name,level').in('id', classIds) : { data: [] as any[] };
      const classMap = new Map((classes || []).map(c => [c.id, c]));
      childList.forEach(c => {
        const cls = classMap.get(c.classId || '');
        c.level = cls?.name || '';
        c.track = cls?.level === 'a_level' ? 'A-Level' : cls?.level === 'o_level' ? 'O-Level' : '';
      });
      setChildren(childList);
      const selected = childList.find(c => c.id === childId) || childList[0];
      setChildId(selected.id);

      const [{ data: subjectLinks }, { data: attendance }, { data: grades }, { data: examResults }, { data: reportCardRows }, { data: progressRows }] = await Promise.all([
        supabase.from('student_subjects').select('class_subject_id').eq('student_id', selected.id),
        supabase.from('attendance').select('status').eq('student_id', selected.id),
        supabase.from('grades').select('score,max_score,class_subject_id').eq('student_id', selected.id),
        supabase.from('exam_results').select('marks,max_marks,class_subject_id,is_published').eq('student_id', selected.id).eq('is_published', true),
        supabase.from('report_cards').select('id,average_score,position,class_size,teacher_comment,head_comment,pdf_path,published_at').eq('student_id', selected.id).eq('status', 'published').order('created_at', { ascending: false }).limit(10),
        supabase.from('student_progress').select('completion_percent,average_score,class_subject_id').eq('student_id', selected.id)
      ]);

      const csIds = [...new Set((subjectLinks || []).map(x => x.class_subject_id).filter(Boolean))];
      const { data: classSubjects } = csIds.length
        ? await supabase.from('class_subjects').select('id,subject_id').in('id', csIds)
        : { data: [] as any[] };
      const subjectIds = [...new Set((classSubjects || []).map(x => x.subject_id).filter(Boolean))];
      const { data: subjectDefs } = subjectIds.length
        ? await supabase.from('subjects').select('id,name').in('id', subjectIds)
        : { data: [] as any[] };
      const csToSubject = new Map((classSubjects || []).map(x => [x.id, x.subject_id]));
      const nameMap = new Map((subjectDefs || []).map(x => [x.id, x.name]));
      const gradeMap = new Map<string, number[]>();
      (grades || []).forEach(g => {
        const sid = csToSubject.get(g.class_subject_id);
        if (!sid || g.max_score == null) return;
        const value = Number(g.score) / Number(g.max_score) * 100;
        if (!gradeMap.has(sid)) gradeMap.set(sid, []);
        gradeMap.get(sid)!.push(value);
      });
      const progressMap = new Map<string, number>();
      (progressRows || []).forEach(p => {
        const sid = csToSubject.get(p.class_subject_id);
        if (sid) progressMap.set(sid, Number(p.completion_percent ?? p.average_score ?? 0));
      });
      setSubjects(subjectIds.map(id => {
        const vals = gradeMap.get(id) || [];
        const score = vals.length ? vals.reduce((a,b) => a+b, 0) / vals.length : 0;
        return { id, name: nameMap.get(id) || 'Subject', score: Math.round(score), progress: Math.round(progressMap.get(id) ?? score) };
      }).sort((a,b) => a.name.localeCompare(b.name)));

      const att = attendance || [];
      const present = att.filter(a => ['present','late'].includes(String(a.status).toLowerCase())).length;
      setAttendancePct(att.length ? Math.round(present / att.length * 100) : null);
      const gradeValues = (grades || []).filter(g => g.max_score != null).map(g => Number(g.score) / Number(g.max_score) * 100);
      const examValues = (examResults || []).filter(g => g.max_marks != null).map(g => Number(g.marks) / Number(g.max_marks) * 100);
      const allMarks = [...gradeValues, ...examValues];
      const reportAverage = reportCardRows?.[0]?.average_score;
      setReportCards((reportCardRows || []) as ReportCardRow[]);
      setAttendanceHistory((attendance || []) as AttendanceRow[]);
      setAverage(reportAverage != null ? Number(reportAverage) : allMarks.length ? Math.round(allMarks.reduce((a,b)=>a+b,0)/allMarks.length) : null);
      const progVals = (progressRows || []).map(p => Number(p.completion_percent ?? 0)).filter(Boolean);
      setProgress(progVals.length ? Math.round(progVals.reduce((a,b)=>a+b,0)/progVals.length) : null);

      const subjectClassIds = csIds;
      const [{ data: assignmentRows }, { data: submissionRows }, { data: timetableRows }, { data: announcements }, { data: eventRows }, { data: feeRows }, { data: messageRows }] = await Promise.all([
        subjectClassIds.length ? supabase.from('assignments').select('id,title,due_at,class_subject_id').in('class_subject_id', subjectClassIds).eq('status','published').order('due_at',{ascending:true}).limit(20) : Promise.resolve({data:[] as any[]}),
        supabase.from('assignment_submissions').select('assignment_id,status,score').eq('student_id', selected.id),
        selected.classId ? supabase.from('timetable').select('id,start_time,end_time,room,class_subject_id,weekday').eq('class_id', selected.classId).order('weekday').order('start_time') : Promise.resolve({data:[] as any[]}),
        supabase.from('announcements').select('id,title,body,published_at').eq('status','published').order('published_at',{ascending:false}).limit(8),
        supabase.from('events').select('id,title,description,starts_at,location,status').eq('status','published').order('starts_at',{ascending:true}).limit(6),
        supabase.from('fee_accounts').select('id,student_id,total_amount,amount_paid,currency,due_date,status').eq('parent_id', parent.id).eq('student_id', selected.id).order('due_date',{ascending:true}),
        supabase.from('parent_messages').select('id,subject,body,created_at,read_at').eq('parent_id', parent.id).order('created_at',{ascending:false}).limit(30)
      ]);
      const submissionMap = new Map((submissionRows || []).map(s => [s.assignment_id, s]));
      setAssignments((assignmentRows || []).map(a => {
        const sub = submissionMap.get(a.id);
        const cs = (classSubjects || []).find(x => x.id === a.class_subject_id);
        return { id:a.id, title:a.title, due_at:a.due_at, subject:nameMap.get(cs?.subject_id) || 'Subject', status:sub?.status || 'pending', score:sub?.score ?? null };
      }));
      setTimetable((timetableRows || []).filter(x => Number(x.weekday) === ((new Date().getDay() + 6) % 7 + 1)).map(x => {
        const cs=(classSubjects||[]).find(c=>c.id===x.class_subject_id);
        return {id:x.id,start_time:x.start_time,end_time:x.end_time,room:x.room,subject:nameMap.get(cs?.subject_id)||'Lesson'};
      }));
      setNotices([...(announcements || []).map(n=>({id:n.id,title:n.title,body:n.body,published_at:n.published_at})), ...(eventRows || []).map(e=>({id:e.id,title:e.title,body:e.description||e.location||'School event',published_at:e.starts_at}))].slice(0,10));
      setFees((feeRows || []) as FeeRow[]);
      setMessages((messageRows || []) as MessageRow[]);

      const { data: materialRows } = subjectClassIds.length
        ? await supabase.from('learning_materials').select('id,title,description,bucket_path,mime_type,class_subject_id').in('class_subject_id', subjectClassIds).eq('status','published').order('created_at',{ascending:false}).limit(30)
        : { data: [] as any[] };
      setMaterials((materialRows || []) as MaterialRow[]);
      const urls: Record<string,string> = {};
      for (const m of (materialRows || [])) {
        const { data: signed } = await supabase.storage.from('Mount Masaba High School').createSignedUrl(m.bucket_path, 3600);
        if (signed?.signedUrl) urls[m.id] = signed.signedUrl;
      }
      setMaterialUrls(urls);
    } catch (error: any) {
      setDataError(error?.message || 'Unable to load your parent portal data.');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [childId]);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSessionReady(!!session);
      if (session) loadPortal();
      else setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionReady(!!session);
      if (session) loadPortal(true);
      else { setLoading(false); setChildren([]); }
    });
    return () => { mounted=false; listener.subscription.unsubscribe(); };
  }, [loadPortal]);

  useEffect(() => {
    if (!parentId || !childId) return;
    const channel = supabase.channel('parent-live-' + parentId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => { setLiveNotification('New school notice available.'); loadPortal(true); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => { setLiveNotification('School calendar updated.'); loadPortal(true); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parent_messages', filter: 'parent_id=eq.' + parentId }, () => { setLiveNotification('Your school messages were updated.'); loadPortal(true); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance', filter: 'student_id=eq.' + childId }, () => { setLiveNotification('Attendance was updated.'); loadPortal(true); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'grades', filter: 'student_id=eq.' + childId }, () => { setLiveNotification('Academic results were updated.'); loadPortal(true); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [parentId, childId, loadPortal]);

  async function askAssistant(e: React.FormEvent) {
    e.preventDefault();
    if (!assistantQuestion.trim() || !childId || assistantBusy) return;
    setAssistantBusy(true); setAssistantError('');
    const { data, error } = await supabase.functions.invoke('parent-assistant', { body: { question: assistantQuestion.trim(), student_id: childId } });
    if (error || !data?.answer) setAssistantError('The assistant is temporarily unavailable.');
    else { setAssistantAnswer(data.answer); setAssistantQuestion(''); }
    setAssistantBusy(false);
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault(); setLoggingIn(true); setLoginError('');
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail.trim(), password: loginPassword });
    if (error) setLoginError(error.message);
    setLoggingIn(false);
  }
  async function registerParent(e: React.FormEvent) {
    e.preventDefault();
    setRegisterError(''); setRegisterMessage(''); setLoggingIn(true);
    if (registerPassword.length < 8) {
      setRegisterError('Use a password with at least 8 characters.');
      setLoggingIn(false); return;
    }
    const email = loginEmail.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: registerPassword,
      options: {
        data: {
          full_name: registerName.trim(),
          phone: registerPhone.trim(),
          student_full_name: registerStudentId.trim(),
          requested_role: 'parent'
        }
      }
    });
    if (error) {
      setRegisterError(error.message);
    } else {
      setRegisterMessage(data.session
        ? 'Registration received. Your account is waiting for school administrator approval.'
        : 'Registration received. Check your email if the school requires email confirmation, then wait for administrator approval.');
      setAuthMode('login');
      setLoginPassword('');
      setPendingApproval(true);
    }
    setLoggingIn(false);
  }
  async function signOut() {
    await supabase.auth.signOut();
    setPendingApproval(false);
    if (onBack) onBack();
  }
  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!parentId || !messageSubject.trim() || !messageBody.trim()) return;
    setSendingMessage(true); setMessageStatus('');
    const { data, error } = await supabase.from('parent_messages').insert({
      parent_id: parentId, student_id: child?.id || null, subject: messageSubject.trim(), body: messageBody.trim()
    }).select('id,subject,body,created_at,read_at').single();
    if (error) setMessageStatus(error.message);
    else {
      setMessages(m => [data, ...m]); setMessageSubject(''); setMessageBody(''); setMessageStatus('Message sent to the school.');
    }
    setSendingMessage(false);
  }

  if (!sessionReady) return (
    <div className="parentApp parentAuth">
      <header className="parentHeader"><button className="parentBrand" onClick={onBack}><img className="schoolLogo" src={logoUrl} alt="Mount Masaba High School"/><span><b>Mount Masaba</b><small>Parent Portal</small></span></button></header>
      <main className="parentAuthCard">
        <img className="authLogo" src={logoUrl} alt="Mount Masaba High School"/>
        <span className="eyebrow">PARENT PORTAL</span>
        <div className="authModeSwitch"><button className={authMode==='login'?'active':''} onClick={()=>setAuthMode('login')}>Sign in</button><button className={authMode==='register'?'active':''} onClick={()=>setAuthMode('register')}>Register</button></div>
        {authMode === 'login' ? <>
          <h1>Welcome back.</h1>
          <p>Sign in to see your child’s attendance, learning, results, timetable, fees and school messages.</p>
          <form onSubmit={signIn}>
            <label>Email<input type="email" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} required autoComplete="email"/></label>
            <label>Password<input type="password" value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} required autoComplete="current-password"/></label>
            {loginError && <div className="parentError">{loginError}</div>}
            {registerMessage && <div className="parentSuccess">{registerMessage}</div>}
            <button className="authSubmit" disabled={loggingIn}>{loggingIn ? 'Signing in…' : 'Sign in'} <ArrowRight size={16}/></button>
          </form>
          <small className="authHint">No OTP. New registrations are reviewed and approved by a school administrator.</small>
        </> : <>
          <h1>Create parent account.</h1>
          <p>Register once, then the school administrator links your account to your learner.</p>
          <form onSubmit={registerParent}>
            <label>Full name<input value={registerName} onChange={e=>setRegisterName(e.target.value)} required autoComplete="name"/></label>
            <label>Parent email<input type="email" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} required autoComplete="email"/></label>
            <label>Phone (optional)<input value={registerPhone} onChange={e=>setRegisterPhone(e.target.value)} autoComplete="tel"/></label>
            <label>Child's full name<input value={registerStudentId} onChange={e=>setRegisterStudentId(e.target.value)} required placeholder="e.g. MMHS/001"/></label>
            <label>Password<input type="password" value={registerPassword} onChange={e=>setRegisterPassword(e.target.value)} required minLength={8} autoComplete="new-password"/></label>
            {registerError && <div className="parentError">{registerError}</div>}
            <button className="authSubmit" disabled={loggingIn}>{loggingIn ? 'Creating account…' : 'Create account'} <ArrowRight size={16}/></button>
          </form>
          <small className="authHint">After registration, access stays locked until an administrator approves and links you to the student ID.</small>
        </>}
      </main>
    </div>
  );

  if (loading) return <div className="parentApp parentLoading"><RefreshCw className="spin" size={24}/><p>Loading your family portal…</p></div>;

  if (pendingApproval) return (
    <div className="parentApp parentAuth">
      <header className="parentHeader"><button className="parentBrand" onClick={()=>setActive('Home')}><img className="schoolLogo" src={logoUrl} alt="Mount Masaba High School"/><span><b>Mount Masaba</b><small>Parent Portal</small></span></button><button className="iconButton" onClick={signOut}><LogOut size={18}/></button></header>
      <main className="parentAuthCard"><img className="authLogo" src={logoUrl} alt="Mount Masaba High School"/><span className="eyebrow">ADMIN APPROVAL</span><h1>Registration received.</h1><p>Your parent account is created, but the school must approve it and link it to your learner before the dashboard opens.</p><div className="approvalSteps"><span>✓ Account created</span><span>2&nbsp; Administrator review</span><span>3&nbsp; Parent dashboard access</span></div><button className="authSubmit" onClick={()=>loadPortal(true)}>Check approval <RefreshCw size={16}/></button><button className="secondaryAction" onClick={signOut}>Sign out</button></main>
    </div>
  );

  if (!children.length) return (
    <div className="parentApp parentAuth"><header className="parentHeader"><button className="parentBrand" onClick={onBack}><img className="schoolLogo" src={logoUrl} alt="Mount Masaba High School"/><span><b>Mount Masaba</b><small>Parent Portal</small></span></button><button className="iconButton" onClick={signOut}><LogOut size={18}/></button></header><main className="parentAuthCard"><img className="authLogo" src={logoUrl} alt="Mount Masaba High School"/><span className="eyebrow">ACCOUNT LINKING</span><h1>Almost there.</h1><p>{dataError || 'Your parent account is signed in, but no learner has been linked to it yet.'}</p><button className="authSubmit" onClick={()=>loadPortal()}>Check again <RefreshCw size={16}/></button></main></div>
  );

  const attendance = attendancePct ?? 0;
  const avg = average ?? 0;
  const pulse = progress ?? avg;
  const pendingAssignments = assignments.filter(a => a.status !== 'submitted' && a.status !== 'graded').length;
  const outstanding = fees.reduce((sum,f)=>sum + Math.max(0, Number(f.total_amount)-Number(f.amount_paid)),0);
  const today = timetable.slice(0,4);

  return (
    <div className="parentApp">
      <header className="parentHeader">
        <button className="parentBrand" onClick={()=>setActive('Home')}><img className="schoolLogo" src={logoUrl} alt="Mount Masaba High School"/><span><b>Mount Masaba</b><small>Parent Portal</small></span></button>
        <div className="parentHeaderActions"><button className="iconButton" onClick={()=>setNoticeOpen(true)}><Bell size={19}/>{notices.length>0&&<i/>}</button><button className="parentAvatar" onClick={()=>setActive('More')}>{initials(parentName)}</button></div>
      </header>

      <main className="parentContent">
        {dataError && <div className="parentDataBanner">{dataError}<button onClick={()=>loadPortal(true)}><RefreshCw size={14}/></button></div>}{liveNotification && <div className="parentDataBanner liveNotice">{liveNotification}<button onClick={()=>setLiveNotification('')}>Dismiss</button></div>}
        {active === 'Home' && <>
          <section className="parentWelcome"><div><span className="eyebrow">FAMILY PORTAL</span><h1>Good evening, {parentName.split(' ')[0]} <span>✦</span></h1><p>Here’s what matters most about your child’s school day.</p></div><div className="connectionChip"><span/>Live Supabase data</div></section>
          <section className="childSelectorWrap"><button className="childSelector" onClick={()=>setShowChildren(v=>!v)}><span className="childAvatar sunrise">{child.initials}</span><span className="childMeta"><b>{child.name}</b><small>{child.level || 'Class'} • {child.track || 'School'}</small></span><ChevronDown size={17}/></button>{showChildren&&<div className="childMenu">{children.map(c=><button key={c.id} onClick={()=>{setChildId(c.id);setShowChildren(false)}}><span className="childAvatar sunrise">{c.initials}</span><span><b>{c.name}</b><small>{c.level} • {c.track}</small></span>{c.id===child.id&&<CheckCircle2 size={17}/>}</button>)}</div>}</section>
          <section className="parentHeroCard"><div className="heroGlow"/><img className="heroWatermark" src={logoUrl} alt="" aria-hidden="true"/><div className="heroCopy"><span className="heroEyebrow">WEEKLY PULSE</span><h2>{child.name.split(' ')[0]} is having a <em>{pulse >= 70 ? 'great week.' : 'week that needs attention.'}</em></h2><p>{attendance >= 90 ? 'Strong attendance' : 'Attendance needs attention'}{avg ? ', ' + (avg >= 70 ? 'improving results' : 'results need focus') : ''}. {pendingAssignments ? pendingAssignments + ' assignment' + (pendingAssignments===1?'':'s') + ' need attention.' : 'No urgent academic tasks need your attention.'}</p><button onClick={()=>setActive('Results')}>See full progress <ArrowRight size={16}/></button></div><div className="pulseScore"><div className="pulseRing"><strong>{pulse}</strong><span>/100</span></div><small>Progress</small></div></section>
          <section className="parentMetricGrid"><button className="metricCard" onClick={()=>setActive('Attendance')}><span className="metricIcon mint"><CheckCircle2 size={19}/></span><small>ATTENDANCE</small><b>{attendance}%</b><em>{attendance>=90?'Excellent':'Needs attention'}</em></button><button className="metricCard" onClick={()=>setActive('Results')}><span className="metricIcon blue"><TrendingUp size={19}/></span><small>ACADEMIC AVERAGE</small><b>{avg}%</b><em className="positive">Live term data</em></button><button className="metricCard" onClick={()=>setActive('Learning')}><span className="metricIcon amber"><FileText size={19}/></span><small>ASSIGNMENTS</small><b>{pendingAssignments}<span> due</span></b><em>{assignments.length} published</em></button></section>
          <section className="parentSection"><div className="sectionTitle"><div><span className="eyebrow">TODAY</span><h2>What’s happening</h2></div><button onClick={()=>setActive('Learning')}>View schedule <ArrowRight size={15}/></button></div><div className="todayTimeline">{today.length?today.map((item,i)=><div className={'timeItem '+(i===0?'current':'')} key={item.id}><span>{formatTime(item.start_time)}</span><i/><div><b>{item.subject}</b><small>{item.room||'School timetable'}</small></div><strong>{i===0?'Now':'Today'}</strong></div>):<div className="emptyInline">No timetable entries published for today.</div>}</div></section>
          <section className="attentionCard"><div className="attentionIcon">✦</div><div><span className="eyebrow">PARENT VIEW</span><h3>{subjects.length ? 'Learning is connected.' : 'Learning data is getting ready.'}</h3><p>{subjects.length ? subjects.slice(0,3).map(s=>s.name + ' ' + s.score + '%').join(' • ') : 'Your child’s subject records will appear here once the school publishes them.'}</p></div><button onClick={()=>setActive('Results')}><ArrowRight size={18}/></button></section>
          <section className="parentSection"><div className="sectionTitle"><div><span className="eyebrow">ACADEMIC PULSE</span><h2>How learning is going</h2></div><button onClick={()=>setActive('Results')}>All subjects <ArrowRight size={15}/></button></div><div className="subjectList">{subjects.slice(0,5).map(s=><div className="subjectRow" key={s.id}><span className="subjectDot"/><div><b>{s.name}</b><small>{s.progress}% progress</small></div><strong>{s.score}%</strong><span className="trend">Live</span><div className="meter"><i style={{width:s.score+'%'}}/></div></div>)}{!subjects.length&&<div className="emptyInline">No subject results have been published yet.</div>}</div></section>
          <section className="parentSection splitSection"><div className="schoolCard"><div className="cardTop"><span className="eyebrow">SCHOOL</span><MessageCircle size={18}/></div><h3>{messages.length ? 'School messages' : 'Contact the school'}</h3><p>{messages.length ? messages[0].subject : 'Send a message to the school about your child.'}</p><button onClick={()=>setActive('Messages')}>Open messages <ArrowRight size={15}/></button></div><div className="schoolCard warm"><div className="cardTop"><span className="eyebrow">FEES</span><WalletCards size={18}/></div><h3>{outstanding ? money(outstanding, fees[0]?.currency||'UGX') : 'Account clear'}</h3><p>{outstanding ? 'Outstanding balance' : 'No outstanding balance recorded.'}</p><button onClick={()=>setActive('More')}>View fees <ArrowRight size={15}/></button></div></section>
          <section className="parentAI"><div className="aiOrb"><Sparkles size={22}/></div><div className="parentAIContent"><span className="eyebrow">PARENT ASSISTANT</span><h2>Ask about your child’s progress.</h2><p>Answers are grounded in the school records you are authorized to see.</p><form className="assistantForm" onSubmit={askAssistant}><input value={assistantQuestion} onChange={e=>setAssistantQuestion(e.target.value)} placeholder="e.g. How is my child doing?" required/><button type="submit" disabled={assistantBusy}>{assistantBusy?'Thinking…':'Ask'} <Sparkles size={15}/></button></form>{assistantError&&<small className="assistantError">{assistantError}</small>}{assistantAnswer&&<div className="assistantAnswer">{assistantAnswer}</div>}</div></section>
          <section className="parentSection reassurance"><Heart size={18}/><div><b>You’re doing great as a parent.</b><p>The portal is here to make staying involved simple—not stressful.</p></div></section>
        </>}

        {active === 'Learning' && <Page title="Learning" eyebrow="YOUR CHILD'S LEARNING"><div className="liveGrid"><Panel title="Assignments" icon={<FileText size={18}/>}>{assignments.length?assignments.map(a=><div className="liveRow" key={a.id}><div><b>{a.title}</b><small>{a.subject} • Due {formatDate(a.due_at)}</small></div><strong>{a.status}</strong></div>):<Empty text="No published assignments for this learner yet."/>}</Panel><Panel title="Today's timetable" icon={<CalendarDays size={18}/>}>{timetable.length?timetable.map(t=><div className="liveRow" key={t.id}><div><b>{t.subject}</b><small>{formatTime(t.start_time)}–{formatTime(t.end_time)} • {t.room||'Room TBA'}</small></div></div>):<Empty text="No timetable entries are published for this class."/>}</Panel><Panel title="Learning resources" icon={<BookOpen size={18}/>}><div className="resourceList">{materials.length ? materials.map(m=><div className="liveRow" key={m.id}><div><b>{m.title}</b><small>{m.description || m.mime_type || 'Learning material'}</small></div>{materialUrls[m.id] ? <a className="secondaryAction resourceLink" href={materialUrls[m.id]} target="_blank" rel="noreferrer">Open</a> : <strong>Available</strong>}</div>) : <Empty text="No published learning materials for this learner yet."/>}</div></Panel></div></Page>}

        {active === 'Results' && <Page title="Results" eyebrow="ACADEMIC PROGRESS"><div className="resultSummary"><div><span>AVERAGE</span><b>{avg}%</b><small>Published academic data</small></div><div><span>PROGRESS</span><b>{pulse}%</b><small>Learning progress</small></div><div><span>SUBJECTS</span><b>{subjects.length}</b><small>Connected subjects</small></div></div><Panel title="Subject performance" icon={<TrendingUp size={18}/>}><div className="subjectList">{subjects.map(s=><div className="subjectRow" key={s.id}><span className="subjectDot"/><div><b>{s.name}</b><small>{s.progress}% progress</small></div><strong>{s.score}%</strong><span className="trend">Live</span><div className="meter"><i style={{width:s.score+'%'}}/></div></div>)}{!subjects.length&&<Empty text="No published subject results yet."/>}</div></Panel><Panel title="Report cards" icon={<FileText size={18}/>}><div>{reportCards.length ? reportCards.map(r=><div className="liveRow" key={r.id}><div><b>{r.average_score != null ? Math.round(Number(r.average_score)) + '% average' : 'Published report card'}</b><small>{r.position && r.class_size ? 'Position ' + r.position + ' of ' + r.class_size : 'Published ' + formatDate(r.published_at)}</small></div>{r.pdf_path ? <span><b>PDF ready</b></span> : <strong>View online</strong>}</div>) : <Empty text="No published report cards yet."/>}</div></Panel></Page>}

        {active === 'Attendance' && <Page title="Attendance" eyebrow="SCHOOL ATTENDANCE"><div className="resultSummary"><div><span>ATTENDANCE</span><b>{attendance}%</b><small>{attendance>=90?'Excellent standing':'Needs attention'}</small></div></div><Panel title="Attendance history" icon={<CheckCircle2 size={18}/>}><div>{attendanceHistory.slice(0,30).map(a=><div className="liveRow" key={a.id}><div><b>{a.status}</b><small>{formatDate(a.attendance_date)}{a.note ? ' • ' + a.note : ''}</small></div><strong>{['present','late'].includes(a.status.toLowerCase()) ? 'Present' : 'Absent'}</strong></div>)}{!attendanceHistory.length&&<Empty text="No attendance records published yet."/>}</div><button className="secondaryAction" onClick={()=>loadPortal(true)}>Refresh records <RefreshCw size={15}/></button></Panel></Page>}

        {active === 'Messages' && <Page title="Messages" eyebrow="SCHOOL COMMUNICATION"><div className="liveGrid"><Panel title="Conversation history" icon={<MessageCircle size={18}/>}><div>{messages.length?messages.map(m=><div className="messageItem" key={m.id}><b>{m.subject}</b><small>{formatDate(m.created_at)} • {m.read_at?'Read':'Unread'}</small><p>{m.body}</p></div>):<Empty text="No messages yet. Send the school a message below."/ >}</div></Panel><Panel title="Message the school" icon={<Send size={18}/>}><form className="messageForm" onSubmit={sendMessage}><input value={messageSubject} onChange={e=>setMessageSubject(e.target.value)} placeholder="Subject" required/><textarea value={messageBody} onChange={e=>setMessageBody(e.target.value)} placeholder="Write your message…" rows={6} required/><button className="authSubmit" disabled={sendingMessage}>{sendingMessage?'Sending…':'Send message'} <Send size={15}/></button>{messageStatus&&<small>{messageStatus}</small>}</form></Panel></div></Page>}

        {active === 'More' && <Page title="More" eyebrow="FAMILY SERVICES"><div className="liveGrid"><Panel title="Fees & account" icon={<CircleDollarSign size={18}/>}><div className="feeTotal">{money(outstanding, fees[0]?.currency||'UGX')}</div><small>Outstanding balance</small>{fees.map(f=><div className="liveRow" key={f.id}><div><b>{f.status}</b><small>Due {formatDate(f.due_date)}</small></div><strong>{money(Math.max(0,Number(f.total_amount)-Number(f.amount_paid)),f.currency)}</strong></div>)}{!fees.length&&<Empty text="No fee account has been published for this learner."/ >}</Panel><Panel title="School notices" icon={<Bell size={18}/>}><div>{notices.length?notices.map(n=><div className="messageItem" key={n.id}><b>{n.title}</b><small>{formatDate(n.published_at)}</small><p>{n.body}</p></div>):<Empty text="No current school notices."/ >}</div></Panel><Panel title="Account" icon={<MoreHorizontal size={18}/>}><div className="accountBox"><img src={logoUrl} alt="School logo"/><b>{parentName}</b><small>{userEmail}</small><button className="secondaryAction" onClick={signOut}><LogOut size={15}/> Sign out</button></div></Panel></div></Page>}
      </main>

      {noticeOpen&&<div className="parentModal" onClick={()=>setNoticeOpen(false)}><div className="noticeSheet" onClick={e=>e.stopPropagation()}><button onClick={()=>setNoticeOpen(false)}><X size={18}/></button><span className="eyebrow">SCHOOL UPDATES</span><h2>{notices.length?'Latest updates':'Nothing urgent.'}</h2>{notices.slice(0,5).map(n=><div className="messageItem" key={n.id}><b>{n.title}</b><small>{formatDate(n.published_at)}</small><p>{n.body}</p></div>)}{!notices.length&&<p>No published school notices right now.</p>}</div></div>}

      <ParentNav active={active} setActive={setActive}/>
    </div>
  );
}

function Page({title,eyebrow,children}:{title:string;eyebrow:string;children:React.ReactNode}) {
  return <div className="parentSubpage"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p className="subcopy">Live information from the Mount Masaba school system.</p>{children}</div>;
}
function Panel({title,icon,children}:{title:string;icon:React.ReactNode;children:React.ReactNode}) {
  return <section className="parentSection parentLivePanel"><div className="sectionTitle"><div><span className="eyebrow">LIVE DATA</span><h2>{title}</h2></div>{icon}</div>{children}</section>;
}
function Empty({text}:{text:string}) { return <div className="emptyInline">{text}</div>; }
function ParentNav({active,setActive}:{active:string;setActive:(s:string)=>void}) {
  const nav=[['Home',Home],['Learning',BookOpen],['Results',TrendingUp],['Messages',MessageCircle],['More',MoreHorizontal]] as const;
  return <nav className="parentBottomNav">{nav.map(([label,Icon])=><button key={label} className={active===label?'active':''} onClick={()=>setActive(label)}><Icon size={19}/><span>{label}</span></button>)}</nav>;
}
