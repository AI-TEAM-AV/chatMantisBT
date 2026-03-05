import { v4 as uuidv4 } from 'uuid'
import { conversationStorage, messageStorage, isInitialized, markInitialized } from './storage.js'

const OPERATORS = [
  { id: 'op-1', name: 'Admin', username: 'admin', password: 'admin123', avatar: 'A' },
  { id: 'op-2', name: 'Soporte', username: 'soporte', password: 'soporte123', avatar: 'S' },
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
    lastMessage: 'Gracias, quedamos a la espera.',
    lastMessageAt: hours(2),
    unread: 0,
    createdAt: hours(12),
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
    { id: uuidv4(), conversationId: 'conv-4', sender: 'user', text: 'La impresora del piso 3 dejó de aparecer en la red después de la actualización de ayer.', createdAt: hours(12) },
    { id: uuidv4(), conversationId: 'conv-4', sender: 'operator', text: 'Entendido Pedro. Voy a coordinar con el equipo de infraestructura para revisarla esta tarde.', createdAt: hours(11) },
    { id: uuidv4(), conversationId: 'conv-4', sender: 'user', text: 'Gracias, quedamos a la espera.', createdAt: hours(2) },
  ],
}

export function seedIfNeeded() {
  if (isInitialized()) return
  conversationStorage.save(seedConversations)
  Object.entries(seedMessages).forEach(([convId, messages]) => {
    messages.forEach(msg => messageStorage.add(convId, msg))
  })
  markInitialized()
}

export { OPERATORS }
