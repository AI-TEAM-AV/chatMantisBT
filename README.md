# Mesa de Ayuda — chatMantisBT

Frontend en React para sistema de mesa de ayuda / help desk con interfaz estilo chat.

## Tecnologías

- **React 18** + **Vite**
- **React Router v6** — navegación SPA
- **Tailwind CSS** — estilos utilitarios
- **Lucide React** — iconografía
- **date-fns** — formateo de fechas
- **uuid** — generación de IDs únicos

## Inicio rápido

```bash
npm install
npm run dev
```

La app corre en `http://localhost:5173`.

## Cuentas de prueba

| Usuario   | Contraseña    |
|-----------|---------------|
| `admin`   | `admin123`    |
| `soporte` | `soporte123`  |

## Estructura

```
src/
├── context/       # AuthContext y ChatContext
├── components/    # Componentes reutilizables
├── pages/         # LoginPage y ChatPage
├── services/      # storage.js (localStorage) y seed.js (datos iniciales)
└── utils/         # helpers de formato y constantes
```

## Persistencia

Todos los mensajes y conversaciones se almacenan en `localStorage`, por lo que persisten entre recargas de página.

## Conectar backend

Para producción, reemplazá las funciones de `services/storage.js` con llamadas a tu API REST y el `receiveMessage` del `ChatContext` con eventos de WebSocket / Socket.io.
