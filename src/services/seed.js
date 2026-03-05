import { v4 as uuidv4 } from 'uuid'
import { conversationStorage, messageStorage, operatorListStorage, isInitialized, markInitialized } from './storage.js'

const OPERATORS = [
  {
    id: 'op-1',
    name: 'Admin',
    email: 'admin@helpdesk.com',
    password: 'admin123',
    role: 'admin',
    avatar: 'A',
    createdAt: Date.now(),
  },
  {
    id: 'op-2',
    name: 'Soporte',
    email: 'soporte@helpdesk.com',
    password: 'soporte123',
    role: 'operator',
    avatar: 'SO',
    createdAt: Date.now(),
  },
]

const now = Date.now()
const mins = (n) => now - n * 60 * 1000
const hours = (n) => now - n * 60 * 60 * 1000

const seedConversations = [
  {
    id: 'conv-1',
    userId: 'user-1',
    userName: 'María García',
    userEmail: 'maria.garcia@empresa.com',
    subject: 'No puedo acceder al sistema',
    status: 'open',
    priority: 'high',
    lastMessage: 'Sigo sin poder entrar, necesito ayuda urgente.',
    lastMessageAt: mins(5),
    unread: 2,
    createdAt: hours(3),
  },
  {
    id: 'conv-2',
    userId: 'user-2',
    userName: 'Carlos López',
    userEmail: 'carlos.lopez@empresa.com',
    subject: 'Error al generar reportes',
    status: 'open',
    priority: 'medium',
    lastMessage: 'El reporte de ventas arroja un error 500.',
    lastMessageAt: mins(22),
    unread: 1,
    createdAt: hours(5),
  },
  {
    id: 'conv-3',
    userId: 'user-3',
    userName: 'Ana Martínez',
    userEmail: 'ana.martinez@empresa.com',
    subject: 'Solicitud de nuevo usuario',
    status: 'open',
    priority: 'low',
    lastMessage: '¿Cuándo estará listo el acceso para el nuevo empleado?',
    lastMessageAt: hours(1),
    unread: 0,
    createdAt: hours(8),
  },
  {
    id: 'conv-4',
    userId: 'user-4',
    userName: 'Pedro Rodríguez',
    userEmail: 'pedro.rodriguez@empresa.com',
    subject: 'Problema con impresora de red',
    status: 'pending',
    priority: 'medium',
    lastMessage: 'La impresora del piso 3 no aparece en la red.',
    lastMessageAt: hours(2),
    unread: 3,
    createdAt: hours(2),
  },
  {
    id: 'conv-5',
    userId: 'user-5',
    userName: 'Lucía Herrera',
    userEmail: 'lucia.herrera@empresa.com',
    subject: 'No carga el módulo de facturación',
    status: 'pending',
    priority: 'high',
    lastMessage: 'Necesito resolver esto hoy, tengo facturas que emitir.',
    lastMessageAt: mins(12),
    unread: 4,
    createdAt: mins(12),
  },
  {
    id: 'conv-6',
    userId: 'user-6',
    userName: 'Tomás Vega',
    userEmail: 'tomas.vega@empresa.com',
    subject: 'Pantalla en blanco al iniciar sesión',
    status: 'pending',
    priority: 'high',
    lastMessage: 'Desde esta mañana no puedo entrar, la pantalla queda en blanco.',
    lastMessageAt: mins(30),
    unread: 2,
    createdAt: mins(30),
  },
  {
    id: 'conv-7',
    userId: 'user-7',
    userName: 'Valentina Cruz',
    userEmail: 'valentina.cruz@empresa.com',
    subject: 'Solicitud de permiso para instalar software',
    status: 'pending',
    priority: 'low',
    lastMessage: 'Necesito instalar el Adobe Acrobat para trabajar con PDFs.',
    lastMessageAt: hours(4),
    unread: 1,
    createdAt: hours(4),
  },
  {
    id: 'conv-8',
    userId: 'user-8',
    userName: 'Martín Suárez',
    userEmail: 'martin.suarez@empresa.com',
    subject: 'Correo corporativo no envía adjuntos',
    status: 'pending',
    priority: 'medium',
    lastMessage: 'Cuando intento enviar un archivo me da error de tamaño aunque sea pequeño.',
    lastMessageAt: hours(1),
    unread: 2,
    createdAt: hours(1),
  },
]

const seedMessages = {
  'conv-1': [
    { id: uuidv4(), conversationId: 'conv-1', sender: 'user', text: 'Hola, buenos días. Estoy intentando ingresar al sistema pero me dice que mi contraseña es incorrecta.', createdAt: hours(3) },
    { id: uuidv4(), conversationId: 'conv-1', sender: 'operator', text: 'Buen día, María. Voy a revisar tu cuenta ahora mismo.', createdAt: hours(3) + mins(2) },
    { id: uuidv4(), conversationId: 'conv-1', sender: 'operator', text: 'Encontré que tu cuenta está bloqueada por múltiples intentos fallidos. Te envié un correo para restablecer tu contraseña.', createdAt: hours(2) + mins(50) },
    { id: uuidv4(), conversationId: 'conv-1', sender: 'user', text: 'Revisé el correo pero no llegó nada.', createdAt: mins(15) },
    { id: uuidv4(), conversationId: 'conv-1', sender: 'user', text: 'Sigo sin poder entrar, necesito ayuda urgente.', createdAt: mins(5) },
  ],
  'conv-2': [
    { id: uuidv4(), conversationId: 'conv-2', sender: 'user', text: 'Buenas tardes. Estoy tratando de generar el reporte mensual de ventas y me aparece un error.', createdAt: hours(5) },
    { id: uuidv4(), conversationId: 'conv-2', sender: 'operator', text: '¿Podés indicarme qué dice exactamente el error?', createdAt: hours(4) + mins(45) },
    { id: uuidv4(), conversationId: 'conv-2', sender: 'user', text: 'El reporte de ventas arroja un error 500.', createdAt: mins(22) },
  ],
  'conv-3': [
    { id: uuidv4(), conversationId: 'conv-3', sender: 'user', text: 'Hola, necesitamos crear un usuario nuevo para el empleado que ingresa la semana que viene.', createdAt: hours(8) },
    { id: uuidv4(), conversationId: 'conv-3', sender: 'operator', text: 'Hola Ana, con gusto lo gestiono. ¿Me podés enviar el nombre completo, área y rol del nuevo empleado?', createdAt: hours(7) + mins(30) },
    { id: uuidv4(), conversationId: 'conv-3', sender: 'user', text: 'Claro, es Juan Pérez, área Comercial, rol Vendedor.', createdAt: hours(2) },
    { id: uuidv4(), conversationId: 'conv-3', sender: 'operator', text: 'Perfecto, ya inicié el trámite. Generalmente demora entre 24 y 48 horas hábiles.', createdAt: hours(1) + mins(45) },
    { id: uuidv4(), conversationId: 'conv-3', sender: 'user', text: '¿Cuándo estará listo el acceso para el nuevo empleado?', createdAt: hours(1) },
  ],
  'conv-4': [
    { id: uuidv4(), conversationId: 'conv-4', sender: 'user', text: 'Buen día. La impresora del piso 3 dejó de aparecer en la red después de la actualización de ayer.', createdAt: hours(2) },
    { id: uuidv4(), conversationId: 'conv-4', sender: 'user', text: 'Ya intenté reiniciarla y sigue sin aparecer.', createdAt: hours(2) + mins(3) },
    { id: uuidv4(), conversationId: 'conv-4', sender: 'user', text: 'La impresora del piso 3 no aparece en la red.', createdAt: hours(2) + mins(5) },
  ],
  'conv-5': [
    { id: uuidv4(), conversationId: 'conv-5', sender: 'user', text: 'Hola, urgente! El módulo de facturación no carga, queda cargando infinito.', createdAt: mins(12) },
    { id: uuidv4(), conversationId: 'conv-5', sender: 'user', text: 'Probé en otro navegador y pasa lo mismo.', createdAt: mins(11) },
    { id: uuidv4(), conversationId: 'conv-5', sender: 'user', text: 'Necesito resolver esto hoy, tengo facturas que emitir.', createdAt: mins(12) },
  ],
  'conv-6': [
    { id: uuidv4(), conversationId: 'conv-6', sender: 'user', text: 'Buenos días. Desde esta mañana cuando ingreso mis credenciales la pantalla queda completamente en blanco.', createdAt: mins(30) },
    { id: uuidv4(), conversationId: 'conv-6', sender: 'user', text: 'Desde esta mañana no puedo entrar, la pantalla queda en blanco.', createdAt: mins(30) + mins(2) },
  ],
  'conv-7': [
    { id: uuidv4(), conversationId: 'conv-7', sender: 'user', text: 'Hola. Quisiera solicitar permiso para instalar el Adobe Acrobat Reader en mi equipo.', createdAt: hours(4) },
    { id: uuidv4(), conversationId: 'conv-7', sender: 'user', text: 'Lo necesito para poder abrir documentos PDF que me envían los clientes.', createdAt: hours(4) + mins(1) },
    { id: uuidv4(), conversationId: 'conv-7', sender: 'user', text: 'Necesito instalar el Adobe Acrobat para trabajar con PDFs.', createdAt: hours(4) + mins(3) },
  ],
  'conv-8': [
    { id: uuidv4(), conversationId: 'conv-8', sender: 'user', text: 'Buen día. Tengo un problema con mi correo corporativo, no me deja enviar archivos adjuntos.', createdAt: hours(1) },
    { id: uuidv4(), conversationId: 'conv-8', sender: 'user', text: 'El error dice "archivo demasiado grande" pero el PDF que quiero enviar pesa solo 200KB.', createdAt: hours(1) + mins(2) },
    { id: uuidv4(), conversationId: 'conv-8', sender: 'user', text: 'Cuando intento enviar un archivo me da error de tamaño aunque sea pequeño.', createdAt: hours(1) + mins(5) },
  ],
}

export function seedIfNeeded() {
  // Always ensure operators list exists, even if the app was initialized before this feature
  if (operatorListStorage.getAll().length === 0) {
    operatorListStorage.save(OPERATORS)
  }

  if (isInitialized()) return
  conversationStorage.save(seedConversations)
  Object.entries(seedMessages).forEach(([convId, messages]) => {
    messages.forEach(msg => messageStorage.add(convId, msg))
  })
  markInitialized()
}

export { OPERATORS }
