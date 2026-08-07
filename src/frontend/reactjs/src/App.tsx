import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Archive,
  ArrowDownToLine,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheckBig,
  Clock3,
  FileSpreadsheet,
  Inbox,
  LayoutGrid,
  ListFilter,
  LogOut,
  Mail,
  Menu,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import { api, type UserProfile } from './api'
import AuthScreen from './AuthScreen'
import type { Filter, Todo } from './types'

const starterTasks: Todo[] = [
  { id: 1, title: 'Finish product proposal', description: 'Review the final scope, add launch milestones, and share with the product team.', isCompleted: false, createdAt: new Date().toISOString(), attachments: 2 },
  { id: 2, title: 'Book dentist appointment', description: 'Call the clinic and find an early morning slot.', isCompleted: false, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 3, title: 'Plan weekend hike', description: 'Check the weather and send the trail details to everyone.', isCompleted: false, createdAt: new Date(Date.now() - 172800000).toISOString(), attachments: 1 },
  { id: 4, title: 'Send invoice to Northstar', description: 'Include the approved expenses from last month.', isCompleted: true, createdAt: new Date(Date.now() - 259200000).toISOString() },
  { id: 5, title: 'Update portfolio case study', description: 'Replace the old screenshots and tighten the results section.', isCompleted: false, createdAt: new Date(Date.now() - 345600000).toISOString() },
  { id: 6, title: 'Order new running shoes', description: 'Compare the two shortlisted pairs before ordering.', isCompleted: true, createdAt: new Date(Date.now() - 432000000).toISOString() },
]

const readLocalTasks = () => {
  try {
    const stored = localStorage.getItem('donezo_tasks')
    return stored ? (JSON.parse(stored) as Todo[]) : starterTasks
  } catch {
    return starterTasks
  }
}

const formatDate = (date: string) => {
  const value = new Date(date)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (value.toDateString() === today.toDateString()) return 'Today'
  if (value.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return value.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function App() {
  const [sessionEmail, setSessionEmail] = useState(() => localStorage.getItem('donezo_session') ?? sessionStorage.getItem('donezo_session') ?? '')

  if (!sessionEmail) return <AuthScreen onAuthenticated={setSessionEmail} />

  return <Dashboard email={sessionEmail} onLogout={() => {
    localStorage.removeItem('todo_access_token')
    localStorage.removeItem('donezo_session')
    sessionStorage.removeItem('todo_access_token')
    sessionStorage.removeItem('donezo_session')
    setSessionEmail('')
  }} />
}

function Dashboard({ email, onLogout }: { email: string; onLogout: () => void }) {
  const [tasks, setTasks] = useState<Todo[]>(readLocalTasks)
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Todo | null>(null)
  const [composerOpen, setComposerOpen] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [loading, setLoading] = useState(api.enabled)
  const [notice, setNotice] = useState('')
  const [page, setPage] = useState(1)
  const [accountOpen, setAccountOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const importInput = useRef<HTMLInputElement>(null)
  const pageSize = 5

  useEffect(() => {
    if (!api.enabled) return
    api.list()
      .then((result) => setTasks(result.items))
      .catch(() => setNotice('Could not reach the API. Showing your local tasks.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!api.enabled) localStorage.setItem('donezo_tasks', JSON.stringify(tasks))
  }, [tasks])

  const counts = useMemo(() => ({
    all: tasks.length,
    open: tasks.filter((task) => !task.isCompleted).length,
    completed: tasks.filter((task) => task.isCompleted).length,
  }), [tasks])

  const filtered = useMemo(() => tasks.filter((task) => {
    const matchesFilter = filter === 'all' || (filter === 'completed' ? task.isCompleted : !task.isCompleted)
    const haystack = `${task.title} ${task.description ?? ''}`.toLowerCase()
    return matchesFilter && haystack.includes(query.trim().toLowerCase())
  }), [filter, query, tasks])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize)

  const flash = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3000)
  }

  const addTask = async (title: string, description: string) => {
    try {
      const created = api.enabled
        ? await api.create({ title, description })
        : { id: Date.now(), title, description, isCompleted: false, createdAt: new Date().toISOString() }
      setTasks((current) => [created, ...current])
      setComposerOpen(false)
      setFilter('all')
      flash('Task added')
    } catch {
      flash('Could not add the task. Please try again.')
    }
  }

  const toggleTask = async (task: Todo) => {
    if (task.isCompleted) return
    setTasks((current) => current.map((item) => item.id === task.id ? { ...item, isCompleted: true } : item))
    setSelected((current) => current?.id === task.id ? { ...current, isCompleted: true } : current)
    if (api.enabled) {
      try { await api.complete(task.id) } catch { flash('Task saved locally, but the API did not respond.') }
    }
  }

  const removeTask = async (task: Todo) => {
    setTasks((current) => current.filter((item) => item.id !== task.id))
    setSelected(null)
    if (api.enabled) {
      try { await api.remove(task.id) } catch { flash('Task removed locally, but the API did not respond.') }
    }
    flash('Task deleted')
  }

  const handleImport = async (file?: File) => {
    if (!file) return
    if (!api.enabled) return flash('Connect an API to import spreadsheet tasks.')
    try {
      await api.importFile(file)
      const refreshed = await api.list()
      setTasks(refreshed.items)
      flash('Tasks imported successfully')
    } catch { flash('The file could not be imported.') }
  }

  return (
    <div className="app-shell">
      <Sidebar filter={filter} counts={counts} setFilter={(value) => { setFilter(value); setPage(1) }} open={mobileNav} onClose={() => setMobileNav(false)} />

      <main className="main">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Open menu" onClick={() => setMobileNav(true)}><Menu size={21} /></button>
          <div className="mobile-mark"><span className="brand-symbol"><Check size={14} strokeWidth={3} /></span>donezo</div>
          <div className="search-wrap">
            <Search size={18} />
            <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder="Search your tasks" aria-label="Search tasks" />
            <kbd>⌘ K</kbd>
          </div>
          <div className="account-wrap">
            <button className="avatar" aria-label="Open account menu" aria-expanded={accountOpen} onClick={() => setAccountOpen((value) => !value)}>{email.slice(0, 2).toUpperCase()}</button>
            {accountOpen && <div className="account-menu" role="menu">
              <div className="account-summary"><span>{email.slice(0, 2).toUpperCase()}</span><div><strong>{email.split('@')[0]}</strong><small>{email}</small></div></div>
              <div className="account-rule" />
              <button role="menuitem" onClick={() => { setProfileOpen(true); setAccountOpen(false) }}><UserRound size={17} />View profile</button>
              <button role="menuitem" className="logout-item" onClick={onLogout}><LogOut size={17} />Log out</button>
            </div>}
          </div>
        </header>

        <div className="content">
          <section className="intro">
            <div>
              <p className="eyebrow"><Sparkles size={15} /> SATURDAY, AUGUST 8</p>
              <h1>Good morning, Phong.</h1>
              <p className="subtitle">You have <strong>{counts.open} tasks</strong> left to make today count.</p>
            </div>
            <button className="primary-button" onClick={() => setComposerOpen(true)}><Plus size={18} /> Add task</button>
          </section>

          <section className="summary-card" aria-label="Progress summary">
            <div className="progress-copy">
              <span className="progress-icon"><CircleCheckBig size={23} /></span>
              <div><strong>{counts.completed} completed</strong><span>Nice work — keep the momentum going.</span></div>
            </div>
            <div className="progress-bar"><span style={{ width: `${counts.all ? (counts.completed / counts.all) * 100 : 0}%` }} /></div>
            <strong className="progress-percent">{counts.all ? Math.round((counts.completed / counts.all) * 100) : 0}%</strong>
          </section>

          <section className="task-panel">
            <div className="task-panel-head">
              <div><h2>My tasks</h2><p>{filtered.length} {filtered.length === 1 ? 'task' : 'tasks'} in this view</p></div>
              <div className="panel-actions">
                <button className="secondary-button" onClick={() => importInput.current?.click()}><ArrowDownToLine size={16} /> Import</button>
                <input ref={importInput} type="file" accept=".csv,.xlsx,.xls" hidden onChange={(event) => handleImport(event.target.files?.[0])} />
                <button className="secondary-button" onClick={() => api.enabled ? (window.location.href = api.exportUrl('csv')) : flash('Connect an API to export your tasks.')}><FileSpreadsheet size={16} /> Export</button>
                <button className="icon-button filter-button" aria-label="Filter tasks"><ListFilter size={18} /></button>
              </div>
            </div>

            <div className="filter-tabs" role="tablist">
              {(['all', 'open', 'completed'] as Filter[]).map((item) => (
                <button key={item} role="tab" aria-selected={filter === item} className={filter === item ? 'active' : ''} onClick={() => { setFilter(item); setPage(1) }}>
                  {item === 'open' ? 'To do' : item[0].toUpperCase() + item.slice(1)} <span>{counts[item]}</span>
                </button>
              ))}
            </div>

            <div className="task-list" aria-live="polite">
              {loading ? <LoadingRows /> : visible.length ? visible.map((task) => (
                <article key={task.id} className={`task-row ${task.isCompleted ? 'is-complete' : ''}`} onClick={() => setSelected(task)}>
                  <button className="check-button" aria-label={task.isCompleted ? `${task.title} completed` : `Complete ${task.title}`} onClick={(event) => { event.stopPropagation(); toggleTask(task) }}>
                    {task.isCompleted && <Check size={14} strokeWidth={3} />}
                  </button>
                  <div className="task-copy"><h3>{task.title}</h3><p>{task.description || 'No description'}</p></div>
                  <div className="task-meta">
                    {task.attachments ? <span><Paperclip size={14} /> {task.attachments}</span> : null}
                    <span className={formatDate(task.createdAt) === 'Today' ? 'today' : ''}><Clock3 size={14} /> {formatDate(task.createdAt)}</span>
                    <button className="more-button" aria-label={`More options for ${task.title}`} onClick={(event) => { event.stopPropagation(); setSelected(task) }}><MoreHorizontal size={19} /></button>
                  </div>
                </article>
              )) : <EmptyState onAdd={() => setComposerOpen(true)} />}
            </div>

            {filtered.length > pageSize && <div className="pagination">
              <span>Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}</span>
              <div><button disabled={page === 1} onClick={() => setPage((value) => value - 1)} aria-label="Previous page"><ChevronLeft size={17} /></button><strong>{page}</strong><span>of {totalPages}</span><button disabled={page === totalPages} onClick={() => setPage((value) => value + 1)} aria-label="Next page"><ChevronRight size={17} /></button></div>
            </div>}
          </section>
        </div>
      </main>

      {composerOpen && <TaskComposer onClose={() => setComposerOpen(false)} onSubmit={addTask} />}
      {selected && <TaskDetail task={selected} onClose={() => setSelected(null)} onComplete={() => toggleTask(selected)} onDelete={() => removeTask(selected)} />}
      {profileOpen && <ProfileDrawer email={email} onClose={() => setProfileOpen(false)} />}
      {notice && <div className="toast" role="status"><Check size={16} />{notice}</div>}
    </div>
  )
}

function Sidebar({ filter, counts, setFilter, open, onClose }: { filter: Filter; counts: Record<Filter, number>; setFilter: (filter: Filter) => void; open: boolean; onClose: () => void }) {
  const nav = [
    { value: 'all' as Filter, label: 'All tasks', icon: LayoutGrid },
    { value: 'open' as Filter, label: 'Today', icon: CalendarDays },
    { value: 'completed' as Filter, label: 'Completed', icon: CircleCheckBig },
  ]
  return <>
    {open && <button className="sidebar-backdrop" aria-label="Close menu" onClick={onClose} />}
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand"><span className="brand-symbol"><Check size={15} strokeWidth={3} /></span><span>donezo</span></div>
      <nav aria-label="Main navigation">
        <p>WORKSPACE</p>
        {nav.map(({ value, label, icon: Icon }) => <button key={value} className={filter === value ? 'active' : ''} onClick={() => { setFilter(value); onClose() }}><Icon size={18} /><span>{label}</span><small>{counts[value]}</small></button>)}
        <p className="nav-section">ORGANIZE</p>
        <button><Inbox size={18} /><span>Inbox</span><small>3</small></button>
        <button><Archive size={18} /><span>Archive</span></button>
      </nav>
      <div className="sidebar-spacer" />
      <nav className="lower-nav"><button><Settings size={18} /><span>Settings</span></button></nav>
      <div className="help-card"><span><Sparkles size={17} /></span><strong>Make room for focus</strong><p>Small steps add up. Pick one task and start there.</p></div>
    </aside>
  </>
}

function TaskComposer({ onClose, onSubmit }: { onClose: () => void; onSubmit: (title: string, description: string) => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  return <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="new-task-title" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <form className="composer" onSubmit={(event) => { event.preventDefault(); if (title.trim()) onSubmit(title.trim(), description.trim()) }}>
      <div className="modal-head"><div><span>NEW TASK</span><h2 id="new-task-title">What needs doing?</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close"><X size={20} /></button></div>
      <label>Task name<input autoFocus maxLength={200} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Review project brief" /></label>
      <label>Notes <span>Optional</span><textarea rows={4} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Add a little context…" /></label>
      <div className="composer-tools"><button type="button"><CalendarDays size={16} /> Today <ChevronDown size={14} /></button><button type="button"><Paperclip size={16} /> Attach</button></div>
      <div className="modal-actions"><button type="button" className="text-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={!title.trim()}><Plus size={17} /> Add task</button></div>
    </form>
  </div>
}

function TaskDetail({ task, onClose, onComplete, onDelete }: { task: Todo; onClose: () => void; onComplete: () => void; onDelete: () => void }) {
  return <div className="drawer-layer" role="dialog" aria-modal="true" aria-labelledby="task-detail-title" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <aside className="detail-drawer">
      <div className="drawer-top"><span>TASK DETAILS</span><button className="icon-button" onClick={onClose} aria-label="Close details"><X size={20} /></button></div>
      <div className="detail-body">
        <div className="detail-status"><span className={task.isCompleted ? 'complete' : ''}>{task.isCompleted ? 'Completed' : 'To do'}</span><span><Clock3 size={14} /> {formatDate(task.createdAt)}</span></div>
        <h2 id="task-detail-title">{task.title}</h2>
        <p>{task.description || 'No description has been added yet.'}</p>
        <div className="detail-rule" />
        <h3>Attachments</h3>
        <button className="attachment-drop"><Paperclip size={20} /><span><strong>Add an attachment</strong><small>PDF, image, spreadsheet, or document</small></span></button>
      </div>
      <div className="drawer-actions"><button className="delete-button" onClick={onDelete}><Trash2 size={17} /> Delete</button>{!task.isCompleted && <button className="primary-button" onClick={onComplete}><Check size={17} /> Mark complete</button>}</div>
    </aside>
  </div>
}

function ProfileDrawer({ email, onClose }: { email: string; onClose: () => void }) {
  const [profile, setProfile] = useState<UserProfile>({
    username: email.split('@')[0],
    email,
    isActive: true,
  })
  const [loadingProfile, setLoadingProfile] = useState(api.enabled)

  useEffect(() => {
    if (!api.enabled) return
    api.getProfile()
      .then(setProfile)
      .finally(() => setLoadingProfile(false))
  }, [])

  return <div className="drawer-layer" role="dialog" aria-modal="true" aria-labelledby="profile-title" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <aside className="profile-drawer">
      <div className="drawer-top"><span>YOUR ACCOUNT</span><button className="icon-button" onClick={onClose} aria-label="Close profile"><X size={20} /></button></div>
      <div className="profile-body">
        <div className="profile-hero">
          <span className="profile-avatar">{profile.email.slice(0, 2).toUpperCase()}</span>
          <div><h2 id="profile-title">{loadingProfile ? 'Loading profile…' : profile.username}</h2><p>{profile.email}</p></div>
        </div>
        <div className="profile-status"><ShieldCheck size={16} /><div><strong>Account {profile.isActive ? 'active' : 'inactive'}</strong><span>{profile.isActive ? 'Your account is in good standing.' : 'Contact an administrator for access.'}</span></div></div>
        <div className="profile-section">
          <h3>Personal information</h3>
          <div className="profile-field"><UserRound size={17} /><div><span>Username</span><strong>{profile.username}</strong></div></div>
          <div className="profile-field"><Mail size={17} /><div><span>Email address</span><strong>{profile.email}</strong></div></div>
          {profile.createdAt && <div className="profile-field"><CalendarDays size={17} /><div><span>Member since</span><strong>{new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</strong></div></div>}
        </div>
      </div>
      <div className="profile-footer"><button className="secondary-button" onClick={onClose}>Close</button></div>
    </aside>
  </div>
}

function LoadingRows() {
  return <>{[1, 2, 3, 4].map((item) => <div className="loading-row" key={item}><span /><div><i /><i /></div></div>)}</>
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return <div className="empty-state"><span><CircleCheckBig size={30} /></span><h3>Nothing here — nice and tidy.</h3><p>Add a new task or try a different filter.</p><button className="secondary-button" onClick={onAdd}><Plus size={16} /> Add a task</button></div>
}
