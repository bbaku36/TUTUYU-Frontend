import { useCallback, useEffect, useRef, useState } from 'react'
import AdminPanel from './components/AdminPanel.jsx'
import { listShipments, fetchSections, saveSections, updateShipment } from './api.js'
import {
  ADDRESS_SECTION_TITLE,
  ATTENTION_SECTION_TITLE,
  PRICE_SECTION_TITLE,
  SCHEDULE_PREVIOUS_TITLES,
  SCHEDULE_SECTION_TITLE,
} from './constants.js'

const tabs = [
  {
    id: 'phone',
    label: 'Утас дугаараар',
    placeholder: 'Утас дугаар....',
    helper: '',
  },
  {
    id: 'tracking',
    label: 'Захиалгын трак кодоор',
    placeholder: 'Трак код....',
    helper: 'MC-123456789 эсвэл үйлчилгээнээс авсан код ашиглана.',
  },
]

const defaultAccordionSections = [
  { title: ADDRESS_SECTION_TITLE, description: [], image: '' },
  { title: PRICE_SECTION_TITLE, description: [], image: '' },
  { title: SCHEDULE_SECTION_TITLE, description: [], image: '' },
  { title: ATTENTION_SECTION_TITLE, description: [], image: '' },
]

const heroImagePath = '/ChatGPT Image Nov 25, 2025, 05_55_16 PM.png'
const heroBackgroundPath = '/ChatGPT Image Nov 25, 2025, 07_33_58 PM.png'
const ADMIN_AUTH_KEY = 'tutuyu-admin-auth'
const ADMIN_LOCK_KEY = 'tutuyu-admin-lock'
const ADMIN_MAX_ATTEMPTS = 5
const ADMIN_LOCK_MINUTES = 5
const ADMIN_LOCK_MS = ADMIN_LOCK_MINUTES * 60 * 1000
const adminUserEnv = import.meta.env.VITE_ADMIN_USER
const adminPassEnv = import.meta.env.VITE_ADMIN_PASSWORD || import.meta.env.VITE_ADMIN_PASS
const adminUser = typeof adminUserEnv === 'string' ? adminUserEnv.trim() : ''
const adminPass = typeof adminPassEnv === 'string' ? `${adminPassEnv}` : ''
const adminConfigMissing = !adminUser || !adminPass

const HeroCard = ({ heroImage, backgroundImage }) => (
  <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-[#f9e2cf] via-[#f0c5a3] to-[#e2a07d] p-10 text-[#432b24] shadow-[0_35px_90px_rgba(226,160,125,0.35)]">
    <div
      className="absolute inset-0 bg-[length:cover] bg-center opacity-25"
      style={{
        backgroundImage: `url('${
          backgroundImage || 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80'
        }')`,
      }}
    />
    <div className="relative flex flex-col gap-8 md:flex-row md:items-center">
      <div className="relative mx-auto flex h-56 w-56 items-center justify-center rounded-[38px] border border-white/40 bg-white/50 shadow-[0_20px_60px_rgba(255,255,255,0.35)]">
        <div
          className="absolute inset-0 rounded-[38px] bg-cover bg-center opacity-90"
          style={{
            backgroundImage: `url('${heroImage || backgroundImage || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80'}')`,
          }}
        />
        <div className="absolute inset-0 rounded-[38px] bg-gradient-to-br from-transparent via-white/10 to-[#f0c29d]/40" />
      </div>
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/30 px-4 py-1 text-xs uppercase tracking-[0.4em] text-[#8a6455]">
          Улаанбаатар хот
        </div>
        <div>
          <h1 className="text-4xl font-semibold text-[#3d241c]">TUTUYU Cargo</h1>
          <p className="mt-4 text-base text-[#70483a]">
            Улаанбаатар хотын логистикийн цэгүүдийг бодоход хэв маяг бүхий, зөөлөн ягаан-цагаан өнгөний
            хослолтой интерфэйс. Хэрэглэгчдээ хотын хэмнэлтэй уялдуулан авхаалж самбаатай үйлчилгээ үзүүлээрэй.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-[#9b6b58]">
          {['UB Tracking', '24/7 Support', 'Premium Express'].map((badge) => (
            <span key={badge} className="rounded-full border border-white/70 bg-white/60 px-4 py-2 backdrop-blur">
              {badge}
            </span>
          ))}
        </div>
      </div>
    </div>
  </div>
)

const AccordionItem = ({ section, isOpen, onToggle }) => {
  const [copiedIndex, setCopiedIndex] = useState(null)

  const handleCopy = async (value, index) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 1500)
    } catch {
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 1500)
    }
  }

  return (
    <div className="rounded-3xl border border-[#efd2bf] bg-white px-6 py-4 shadow">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-4 text-left">
        <p className="text-base font-semibold text-[#452922]">{section.title}</p>
        <svg
          className={`h-6 w-6 ${isOpen ? 'rotate-180 text-[#b5654f]' : 'text-[#8f6a5b]'}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {isOpen && (
        <div className="mt-3 space-y-2 text-sm leading-relaxed text-[#6f4a3b]">
          {section.image ? (
            <div className="mb-3 overflow-hidden rounded-2xl border border-[#efd2bf]/70">
              <img src={section.image} alt={section.title} className="h-40 w-full object-cover" />
            </div>
          ) : null}
          {section.description.map((line, index) => {
            const isCopyable = section.title === ADDRESS_SECTION_TITLE
            if (typeof line === 'string') {
              return isCopyable ? (
                <div
                  key={`${line}-${index}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#efd2bf]/60 bg-[#fff9f4] px-4 py-3"
                >
                  <p className="text-sm font-medium text-[#4b2d25]">{line}</p>
                  <button
                    type="button"
                    onClick={() => handleCopy(line, index)}
                    className="rounded-full border border-[#e2a07d] px-3 py-1 text-xs font-semibold text-[#b5654f]"
                  >
                    {copiedIndex === index ? 'Хууллаа' : 'Хуулах'}
                  </button>
                </div>
              ) : (
                <p key={index}>{line}</p>
              )
            }
            return (
              <div
                key={`${line.text || line.copy}-${index}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#efd2bf]/60 bg-[#fff9f4] px-4 py-3"
              >
                <p className="text-sm font-medium text-[#4b2d25]">{line.text?.trim() || line.copy}</p>
                <button
                  type="button"
                  onClick={() => handleCopy(line.copy || line.text, index)}
                  className="rounded-full border border-[#e2a07d] px-3 py-1 text-xs font-semibold text-[#b5654f]"
                >
                  {copiedIndex === index ? 'Хууллаа' : 'Хуулах'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const normalizeSections = (rawSections = []) => {
  const list = Array.isArray(rawSections) && rawSections.length ? rawSections : defaultAccordionSections
  const normalized = []

  const pushUnique = (section) => {
    if (normalized.some((item) => item.title === section.title)) return
    normalized.push({
      title: section.title,
      description: Array.isArray(section.description) ? section.description : [],
      image: section.image || '',
    })
  }

  list.forEach((section) => {
    let title = section.title
    if (title === PRICE_SECTION_TITLE) title = PRICE_SECTION_TITLE
    else if (title === ADDRESS_SECTION_TITLE) title = ADDRESS_SECTION_TITLE
    else if (title === SCHEDULE_SECTION_TITLE || SCHEDULE_PREVIOUS_TITLES.includes(title)) {
      title = SCHEDULE_SECTION_TITLE
    }
    pushUnique({ ...section, title })
  })

  if (!normalized.some((item) => item.title === ADDRESS_SECTION_TITLE)) {
    const schedule = normalized.find((item) => item.title === SCHEDULE_SECTION_TITLE)
    pushUnique({ title: ADDRESS_SECTION_TITLE, description: schedule?.description || [], image: '' })
  }
  if (!normalized.some((item) => item.title === PRICE_SECTION_TITLE)) {
    pushUnique({ title: PRICE_SECTION_TITLE, description: [], image: '' })
  }
  if (!normalized.some((item) => item.title === SCHEDULE_SECTION_TITLE)) {
    pushUnique({ title: SCHEDULE_SECTION_TITLE, description: [], image: '' })
  }
  if (!normalized.some((item) => item.title === ATTENTION_SECTION_TITLE)) {
    pushUnique({ title: ATTENTION_SECTION_TITLE, description: [], image: '' })
  }

  const order = [ADDRESS_SECTION_TITLE, PRICE_SECTION_TITLE, SCHEDULE_SECTION_TITLE, ATTENTION_SECTION_TITLE]
  return [...normalized].sort((a, b) => {
    const ai = order.indexOf(a.title)
    const bi = order.indexOf(b.title)
    if (ai === -1 && bi === -1) return 0
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })
}

function App() {
  const isAdminRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
  const [activeTab, setActiveTab] = useState(tabs[0].id)
  const [query, setQuery] = useState('')
  const [sections, setSections] = useState(defaultAccordionSections)
  const [openSection, setOpenSection] = useState(defaultAccordionSections[0].title)
  const [records, setRecords] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [searched, setSearched] = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryNote, setDeliveryNote] = useState('')
  const [deliveryPhone, setDeliveryPhone] = useState('')
  const [selectedForDelivery, setSelectedForDelivery] = useState([])
  const [deliverySubmitting, setDeliverySubmitting] = useState(false)
  const [deliveryFeedback, setDeliveryFeedback] = useState('')
  const [deliveryError, setDeliveryError] = useState('')
  const [newDeliveryIds, setNewDeliveryIds] = useState([])
  const [isAdminAuthed, setIsAdminAuthed] = useState(false)
  const [adminUserInput, setAdminUserInput] = useState('')
  const [adminPassInput, setAdminPassInput] = useState('')
  const [adminError, setAdminError] = useState('')
  const [adminAttempts, setAdminAttempts] = useState(0)
  const [adminLockedUntil, setAdminLockedUntil] = useState(0)
  const seenDeliveryIdsRef = useRef(new Set())
  const hasInitializedDeliveryRef = useRef(false)
  const amountFor = (record) => (Number(record.declared) || 0) * (record.quantity || 1)
  const viewMode = isAdminRoute ? 'admin' : 'customer'

  useEffect(() => {
    const load = async () => {
      try {
        const data = await listShipments()
        setRecords(data)
      } catch (error) {
        console.error('Ачаа татахад алдаа гарлаа', error)
      }
    }
    load()
  }, [])

  useEffect(() => {
    const loadSections = async () => {
      try {
        const remote = await fetchSections()
        setSections(normalizeSections(remote))
      } catch (error) {
        console.error('Контент татахад алдаа', error)
      }
    }
    loadSections()
  }, [])

  useEffect(() => {
    if (!sections.some((section) => section.title === openSection)) {
      setOpenSection(sections[0]?.title || '')
    }
  }, [sections, openSection])

  useEffect(() => {
    if (!isAdminRoute) return
    try {
      if (adminConfigMissing) {
        setIsAdminAuthed(false)
        localStorage.removeItem(ADMIN_AUTH_KEY)
      }
      const stored = localStorage.getItem(ADMIN_AUTH_KEY)
      if (stored === 'ok') {
        setIsAdminAuthed(true)
      }
      const lockRaw = localStorage.getItem(ADMIN_LOCK_KEY)
      if (lockRaw) {
        try {
          const parsed = JSON.parse(lockRaw)
          const now = Date.now()
          const lockedUntil = Number(parsed?.lockedUntil) || 0
          const attempts = Number(parsed?.attempts) || 0
          if (lockedUntil && lockedUntil > now) {
            setAdminLockedUntil(lockedUntil)
            setAdminAttempts(attempts)
          } else {
            localStorage.removeItem(ADMIN_LOCK_KEY)
            setAdminLockedUntil(0)
            setAdminAttempts(0)
          }
        } catch (lockError) {
          console.error('Админ түгжээний мэдээлэл уншихад алдаа', lockError)
        }
      }
    } catch (error) {
      console.error('Админ эрхийн мэдээлэл уншихад алдаа', error)
    }
  }, [isAdminRoute])

  useEffect(() => {
    const available = searchResults.filter((record) => (record.location || 'warehouse') === 'warehouse')
    setSelectedForDelivery(available.map((record) => record.id))
    if (available.length) {
      setDeliveryPhone((prev) => prev || available[0].phone || '')
      setDeliveryAddress((prev) => prev || available[0].deliveryAddress || '')
    }
  }, [searchResults])

  const handleSectionsChange = async (next) => {
    const normalized = normalizeSections(next)
    setSections(normalized)
    try {
      await saveSections(normalized)
    } catch (error) {
      console.error('Контент хадгалахад алдаа', error)
    }
  }

  const pendingDeliveryIds = () =>
    records
      .filter(
        (record) =>
          (record.location || '') === 'delivery' &&
          (record.deliveryStatus || record.status || '') === 'delivery' &&
          (record.status || '') !== 'delivered',
      )
      .map((record) => record.id)
      .filter(Boolean)

  useEffect(() => {
    const pending = pendingDeliveryIds()
    const seen = seenDeliveryIdsRef.current

    setNewDeliveryIds((prev) => {
      if (!hasInitializedDeliveryRef.current) return []
      const fresh = pending.filter((id) => !seen.has(id))
      const kept = prev.filter((id) => pending.includes(id))
      return Array.from(new Set([...kept, ...fresh]))
    })

    seenDeliveryIdsRef.current = new Set(pending)
    hasInitializedDeliveryRef.current = true
  }, [records])

  const clearNewDelivery = useCallback(() => {
    const pending = pendingDeliveryIds()
    seenDeliveryIdsRef.current = new Set(pending)
    setNewDeliveryIds([])
  }, [records])

  const currentTab = tabs.find((tab) => tab.id === activeTab) ?? tabs[0]
  const requestableShipments = searchResults.filter((record) => (record.location || 'warehouse') === 'warehouse')

  const handleSearch = () => {
    const trimmed = query.trim()
    if (!trimmed) {
      setSearchResults([])
      setSearched(true)
      return
    }
    const matches =
      activeTab === 'phone'
        ? records.filter((record) => (record.phone || '').replace(/\s+/g, '').includes(trimmed.replace(/\s+/g, '')))
        : records.filter((record) => (record.tracking || '').toUpperCase().includes(trimmed.toUpperCase()))

    // зөвхөн олгогдоогүй бараа (хүргэгдсэн + үлдэгдэл 0₮ биш)
    const filtered = matches.filter((record) => {
      const delivered = (record.deliveryStatus || record.status || '') === 'delivered'
      if (delivered) return false
      return true
    })

    setSearchResults(filtered)
    setSearched(true)
  }

  const toggleShipmentSelection = (id) => {
    setSelectedForDelivery((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const syncUpdatedShipments = (updatedList) => {
    const mapById = Object.fromEntries(updatedList.map((item) => [item.id, item]))
    setRecords((prev) => prev.map((record) => mapById[record.id] || record))
    setSearchResults((prev) => prev.map((record) => mapById[record.id] || record))
  }

  const handleDeliveryRequest = async () => {
    setDeliveryError('')
    setDeliveryFeedback('')

    const targets = requestableShipments.filter((record) => selectedForDelivery.includes(record.id))
    const address = deliveryAddress.trim()
    const note = deliveryNote.trim()
    const phoneValue = deliveryPhone.trim()

    if (!targets.length) {
      setDeliveryError('Агуулахад байгаа бараанаас сонгоно уу.')
      return
    }
    if (!address) {
      setDeliveryError('Хүргэлтийн хаягаа оруулна уу.')
      return
    }

    setDeliverySubmitting(true)
    try {
      const updates = await Promise.all(
        targets.map((record) =>
          updateShipment(record.id, {
            ...record,
            phone: phoneValue || record.phone,
            location: 'delivery',
            deliveryStatus: 'delivery',
            deliveryAddress: address,
            deliveryNote: note,
          }),
        ),
      )
      syncUpdatedShipments(updates)
      setDeliveryFeedback('Хүсэлт илгээгдлээ. Манай баг хүргэлтийг бэлтгэнэ.')
    } catch (error) {
      console.error('Хүргэлтийн хүсэлт илгээхэд алдаа', error)
      setDeliveryError('Хүсэлт илгээхэд алдаа гарлаа. Дахин оролдоно уу.')
    } finally {
      setDeliverySubmitting(false)
    }
  }

  const handleAdminLogin = (event) => {
    event.preventDefault()
    setAdminError('')
    const now = Date.now()
    if (adminLockedUntil && now < adminLockedUntil) {
      const remainingMinutes = Math.ceil((adminLockedUntil - now) / 60000)
      setAdminError(`Олон удаа буруу оролдлоо. ${remainingMinutes} минутын дараа дахин оролдоно уу.`)
      return
    }
    if (adminConfigMissing) {
      setAdminError('Нэвтрэх нэр/нууц үг тохируулагдаагүй байна. VITE_ADMIN_USER, VITE_ADMIN_PASSWORD-г .env файлд заавал тохируулна уу.')
      return
    }

    if (adminUserInput.trim() === adminUser && adminPassInput === adminPass) {
      setIsAdminAuthed(true)
      setAdminError('')
      setAdminPassInput('')
      setAdminAttempts(0)
      setAdminLockedUntil(0)
      try {
        localStorage.setItem(ADMIN_AUTH_KEY, 'ok')
        localStorage.removeItem(ADMIN_LOCK_KEY)
      } catch (error) {
        console.error('Админ эрх хадгалахад алдаа', error)
      }
      return
    }
    const nextAttempts = adminAttempts + 1
    const lockExceeded = nextAttempts >= ADMIN_MAX_ATTEMPTS
    const lockedUntil = lockExceeded ? now + ADMIN_LOCK_MS : 0
    setAdminAttempts(lockExceeded ? ADMIN_MAX_ATTEMPTS : nextAttempts)
    setAdminLockedUntil(lockedUntil)
    const attemptsLeft = Math.max(ADMIN_MAX_ATTEMPTS - nextAttempts, 0)
    const message = lockExceeded
      ? `Нэвтрэх хориглолоо. ${ADMIN_LOCK_MINUTES} минутын дараа дахин оролдоно уу.`
      : `Нэвтрэх нэр эсвэл нууц үг буруу. (${attemptsLeft} оролдлого үлдлээ)`
    setAdminError(message)
    try {
      localStorage.setItem(
        ADMIN_LOCK_KEY,
        JSON.stringify({
          attempts: nextAttempts,
          lockedUntil,
        }),
      )
    } catch (error) {
      console.error('Админ түгжээ хадгалахад алдаа', error)
    }
  }

  const handleAdminLogout = () => {
    try {
      localStorage.removeItem(ADMIN_AUTH_KEY)
      localStorage.removeItem(ADMIN_LOCK_KEY)
    } catch (error) {
      console.error('Админ эрх устгахад алдаа', error)
    }
    setIsAdminAuthed(false)
    setAdminUserInput('')
    setAdminPassInput('')
    setAdminAttempts(0)
    setAdminLockedUntil(0)
  }

  return (
    <div className="min-h-screen px-4 py-10 sm:py-12">
      <div
        className={`mx-auto flex w-full flex-col gap-6 ${viewMode === 'admin' ? 'w-screen' : 'max-w-4xl'}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-full border border-white/60 bg-white/80 px-5 py-2 text-xs text-[#8d6457] shadow-lg">
          <div className="flex items-center gap-2 font-semibold text-[#4d2d25]">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#b5654f] text-white">TU</span>
            TUTUYU Cargo
          </div>
          {viewMode === 'admin' ? (
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#f5ede4] px-3 py-1 text-[#8d6457]">Админ хэсэг</span>
              {isAdminAuthed ? (
                <button
                  type="button"
                  onClick={handleAdminLogout}
                  className="rounded-full border border-[#e2a07d] px-3 py-1 font-semibold text-[#b5654f]"
                >
                  Гарах
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {viewMode === 'customer' ? (
          <>
            <HeroCard heroImage={heroImagePath} backgroundImage={heroBackgroundPath} />

            <div className="flex flex-wrap gap-3">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`pill ${activeTab === tab.id ? 'border-[#b5654f] shadow-lg' : ''}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <label className="block text-sm text-[#7b5548]">
              <span className="sr-only">{currentTab.label}</span>
              <div className="rounded-2xl border border-[#efd2bf] bg-white shadow-sm">
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={currentTab.placeholder}
                  className="w-full rounded-2xl border-none bg-transparent px-5 py-4 text-base text-[#3b231f] placeholder:text-[#c99a81] focus:outline-none"
                />
              </div>
              <span className="mt-2 block text-xs text-[#a57163]">{currentTab.helper}</span>
            </label>

            <button
              type="button"
              onClick={handleSearch}
              className="flex w-full items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-[#b5654f] to-[#e2a07d] px-6 py-4 text-base font-semibold text-white shadow-[0_20px_45px_rgba(181,101,79,0.35)] transition hover:-translate-y-0.5"
            >
              <span className="text-lg">🔍</span>
              Статус шалгах
            </button>

            {searched && (
              <div className="space-y-4 rounded-3xl border border-[#efd2bf] bg-white/80 px-4 py-4 text-sm text-[#6f4a3b] shadow">
                {searchResults.length ? (
                  <>
                    {searchResults.map((record) => (
                      <div
                        key={record.id}
                        className="rounded-2xl border border-[#efd2bf]/70 bg-white/90 px-4 py-3 text-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-[#3b231f]">{record.tracking}</p>
                          <span className="text-xs text-[#8d6457]">{record.arrivalDate}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-4 text-xs text-[#7b5447]">
                          <span>Утас: {record.phone || '—'}</span>
                          <span>Жин: {record.weight || '—'} кг</span>
                          <span>Үнэ: {record.declared || '—'}₮</span>
                          <span>Байршил: {record.location === 'delivery' ? 'Хүргэлтэнд' : 'Агуулахад'}</span>
                          <span>Тоо ширхэг: {record.quantity || 1}</span>
                          <span>Нийт дүн: {record.declared ? `${amountFor(record)}₮` : '—'}</span>
                          <span>Төлбөр: {record.status === 'paid' ? 'Төлөгдсөн' : 'Хүлээгдэж байна'}</span>
                        </div>
                      </div>
                    ))}
                    <div className="rounded-2xl border border-[#efd2bf] bg-white px-4 py-3 text-sm font-semibold text-[#4d2d25]">
                      <div className="flex flex-wrap gap-4">
                        <span>
                          Нийт ачаа:{' '}
                          {searchResults.reduce((sum, record) => sum + (record.quantity || 1), 0)} ш
                        </span>
                        <span>Нийт үнэ: {searchResults.reduce((sum, record) => sum + amountFor(record), 0)}₮</span>
                        <span>
                          Үлдэгдэл төлбөр:{' '}
                          {searchResults.reduce(
                            (sum, record) => (record.status === 'paid' ? sum : sum + amountFor(record)),
                            0,
                          )}
                          ₮
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p>Таны оруулсан мэдээллээр бараа олдсонгүй.</p>
                )}
              </div>
            )}
            {searchResults.length > 0 && (
              <div className="space-y-4 rounded-3xl border border-[#efd2bf] bg-white/90 px-5 py-5 text-sm text-[#6f4a3b] shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-[#3b231f]">Ирсэн бараагаа хүргэлтээр авах</p>
                    <p className="text-xs text-[#8d6457]">
                      Агуулахад байгаа бараагаа сонгоод хүргэлтийн хаягаа үлдээгээрэй. Хүсэлт илгээснээр ачааг
                      хүргэлтэнд шилжүүлнэ.
                    </p>
                  </div>
                  <span className="rounded-full bg-[#fbe9dd] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#b5654f]">
                    Хүргэлтийн хүсэлт
                  </span>
                </div>

                {requestableShipments.length ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {requestableShipments.map((record) => {
                        const selected = selectedForDelivery.includes(record.id)
                        return (
                          <button
                            key={record.id}
                            type="button"
                            onClick={() => toggleShipmentSelection(record.id)}
                            className={`flex flex-col items-start gap-2 rounded-2xl border px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 ${
                              selected
                                ? 'border-[#b5654f] bg-gradient-to-r from-[#fff2ea] to-[#ffe5d4]'
                                : 'border-[#efd2bf] bg-white'
                            }`}
                          >
                            <div className="flex w-full items-center justify-between gap-3">
                              <span className="font-semibold text-[#3b231f]">{record.tracking}</span>
                              <span className="text-xs text-[#8d6457]">{record.arrivalDate || 'Ирсэн'}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-[#7b5447]">
                              <span>Тоо: {record.quantity || 1}ш</span>
                              <span>Жин: {record.weight || '—'} кг</span>
                              <span>Үнэ: {record.declared || '—'}₮</span>
                              <span className="rounded-full bg-[#f2d8c6] px-2 py-0.5 text-[11px] font-semibold text-[#7b5447]">
                                {selected ? 'Сонгосон' : 'Сонгох'}
                              </span>
                            </div>
                            <p className="text-xs text-[#a57163]">Байршил: Агуулахад</p>
                          </button>
                        )
                      })}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-[#4d2d25]">
                          Хүргэлтийн утас
                        </span>
                        <input
                          type="tel"
                          value={deliveryPhone}
                          onChange={(event) => setDeliveryPhone(event.target.value)}
                          placeholder="Утасны дугаар..."
                          className="w-full rounded-2xl border border-[#efd2bf] bg-white px-4 py-3 text-sm text-[#3b231f] placeholder:text-[#c99a81] focus:outline-none"
                        />
                      </label>
                      <label className="block space-y-2 sm:col-span-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-[#4d2d25]">
                          Хүргэлтийн хаяг
                        </span>
                        <textarea
                          value={deliveryAddress}
                          onChange={(event) => setDeliveryAddress(event.target.value)}
                          rows={3}
                          placeholder="Дүүрэг, хороо, байр/гудамж, орц...."
                          className="w-full rounded-2xl border border-[#efd2bf] bg-white px-4 py-3 text-sm text-[#3b231f] placeholder:text-[#c99a81] focus:outline-none"
                        />
                      </label>
                      <label className="block space-y-2 sm:col-span-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-[#4d2d25]">
                          Нэмэлт тэмдэглэл
                        </span>
                        <textarea
                          value={deliveryNote}
                          onChange={(event) => setDeliveryNote(event.target.value)}
                          rows={2}
                          placeholder="Орох код, цагийн хуваарь, хүлээн авах хүний нэр..."
                          className="w-full rounded-2xl border border-[#efd2bf] bg-white px-4 py-3 text-sm text-[#3b231f] placeholder:text-[#c99a81] focus:outline-none"
                        />
                      </label>
                    </div>

                    {deliveryError ? (
                      <div className="rounded-2xl border border-[#f7c8c8] bg-[#fff2f2] px-4 py-3 text-sm font-semibold text-[#b42318]">
                        {deliveryError}
                      </div>
                    ) : null}
                    {deliveryFeedback ? (
                      <div className="rounded-2xl border border-[#cde7da] bg-[#f3fbf6] px-4 py-3 text-sm font-semibold text-[#2f8552]">
                        {deliveryFeedback}
                      </div>
                    ) : null}

                    <button
                      type="button"
                      onClick={handleDeliveryRequest}
                      disabled={deliverySubmitting}
                      className="flex w-full items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-[#b5654f] to-[#e2a07d] px-6 py-4 text-base font-semibold text-white shadow-[0_18px_38px_rgba(181,101,79,0.35)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <span className="text-lg">🚚</span>
                      {deliverySubmitting ? 'Хүсэлт илгээж байна...' : 'Хүргэлт захиалах'}
                    </button>
                  </>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#efd2bf] bg-white px-4 py-3 text-sm text-[#8d6457]">
                    Агуулахад хүргэлтэд бэлэн бараа алга байна. Зарим бараа аль хэдийн хүргэлтэнд шилжсэн байж
                    магадгүй.
                  </div>
                )}
              </div>
            )}
            <div className="space-y-3">
              {sections.map((section) => (
                <AccordionItem
                  key={section.title}
                  section={section}
                  isOpen={openSection === section.title}
                  onToggle={() => setOpenSection((prev) => (prev === section.title ? '' : section.title))}
                />
              ))}
            </div>
          </>
        ) : isAdminAuthed ? (
          <AdminPanel
            sections={sections}
            onSectionsChange={handleSectionsChange}
            records={records}
            onRecordsChange={setRecords}
            newDeliveryCount={newDeliveryIds.length}
            onClearNewDelivery={clearNewDelivery}
          />
        ) : (
          <div className="mx-auto max-w-md space-y-5 rounded-3xl border border-[#efd2bf] bg-white/90 px-6 py-6 text-[#4d2d25] shadow">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#b5654f]">Админ нэвтрэх</p>
              <h2 className="text-2xl font-semibold">TUTUYU Admin</h2>
              <p className="text-sm text-[#8d6457]">
                Админ хэсэг зөвхөн <code>/admin</code> хаягаар нэвтэрч байж ажиллана.
              </p>
            </div>
            <form className="space-y-3" onSubmit={handleAdminLogin}>
              <label className="block space-y-1 text-sm text-[#6f4a3b]">
                <span>Нэвтрэх нэр</span>
                <input
                  type="text"
                  value={adminUserInput}
                  onChange={(event) => setAdminUserInput(event.target.value)}
                  className="w-full rounded-2xl border border-[#efd2bf] bg-white px-4 py-3 text-sm text-[#3b231f] placeholder:text-[#c99a81] focus:outline-none"
                  placeholder="Админ нэр"
                />
              </label>
              <label className="block space-y-1 text-sm text-[#6f4a3b]">
                <span>Нууц үг</span>
                <input
                  type="password"
                  value={adminPassInput}
                  onChange={(event) => setAdminPassInput(event.target.value)}
                  className="w-full rounded-2xl border border-[#efd2bf] bg-white px-4 py-3 text-sm text-[#3b231f] placeholder:text-[#c99a81] focus:outline-none"
                  placeholder="********"
                />
              </label>
              {adminError ? (
                <div className="rounded-2xl border border-[#f7c8c8] bg-[#fff2f2] px-4 py-2 text-xs font-semibold text-[#b42318]">
                  {adminError}
                </div>
              ) : null}
              {adminLockedUntil && adminLockedUntil > Date.now() ? (
                <div className="rounded-2xl border border-[#ffe0a3] bg-[#fff8eb] px-4 py-2 text-xs font-semibold text-[#8a5b00]">
                  Нэвтрэх түр хориглогдсон. Дахин оролдох хугацаа: {Math.ceil((adminLockedUntil - Date.now()) / 60000)} мин.
                </div>
              ) : null}
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-[#b5654f] to-[#e2a07d] px-6 py-3 text-base font-semibold text-white shadow-[0_18px_38px_rgba(181,101,79,0.35)] transition hover:-translate-y-0.5"
              >
                Нэвтрэх
              </button>
              <p className="text-xs text-[#a57163]">
                Нэвтрэх нэр/нууц үгийг <code>VITE_ADMIN_USER</code> / <code>VITE_ADMIN_PASSWORD</code> орчноос
                авч хэрэглэнэ. Анхдагч утга байхгүй (заавал тохируулна).
              </p>
              <p className="text-xs text-[#a57163]">
                Аюулгүй байдлын үүднээс {ADMIN_MAX_ATTEMPTS} удаа буруу оруулбал {ADMIN_LOCK_MINUTES} минут түгжинэ.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
