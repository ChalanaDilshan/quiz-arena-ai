import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Users, Play, Loader2, Check, QrCode, Link as LinkIcon, Sparkles, X, Edit2, Shield } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { Player } from '../types';

interface LobbyViewProps {
  roomPin: string;
  players: Player[];
  isHost: boolean;
  currentUserId: string;
  onStartGame: () => void;
  onKickPlayer?: (playerId: string) => void;
  onEditNickname?: (newNickname: string) => void;
}

export function LobbyView({ roomPin, players, isHost, currentUserId, onStartGame, onKickPlayer, onEditNickname }: LobbyViewProps) {
  const [copiedPin, setCopiedPin] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [editingNickname, setEditingNickname] = useState(false);
  const [tempNickname, setTempNickname] = useState('');

  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?pin=${roomPin}`
    : `http://localhost:3000/?pin=${roomPin}`;

  const copyPin = async () => {
    try {
      await navigator.clipboard.writeText(roomPin);
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    } catch {
      // fallback
    }
  };

  const copyJoinLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4 sm:p-6 relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-2xl"
      >
        {/* ── Top Grid: PIN & One-Tap QR Join ───────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
          
          {/* PIN Card */}
          <div className="card rounded-2xl p-6 md:col-span-7 flex flex-col justify-between text-center md:text-left">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] uppercase tracking-widest font-bold text-smoke">
                  Game Access PIN
                </span>
                <span className="badge text-[10px] !py-0.5">Live Lobby</span>
              </div>

              {/* Digit Boxes */}
              <div className="flex items-center justify-center md:justify-start gap-1.5 mb-4">
                {roomPin.split('').map((digit, i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 22 }}
                    className="inline-flex items-center justify-center w-10 sm:w-11 h-12 sm:h-13 text-2xl font-black rounded-xl select-all text-alabaster border border-rim bg-canvas shadow-sm"
                  >
                    {digit}
                  </motion.span>
                ))}

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={copyPin}
                  className="rounded-xl p-2.5 sm:p-3 border border-rim transition-colors hover:border-sienna bg-canvas ml-1"
                  title="Copy 6-Digit PIN"
                >
                  {copiedPin ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-smoke" />
                  )}
                </motion.button>
              </div>
            </div>

            <p className="text-xs text-smoke">
              Players can enter this PIN at <strong className="text-alabaster">{typeof window !== 'undefined' ? window.location.host : 'quizarena.app'}</strong>
            </p>
          </div>

          {/* Quick QR Code Card */}
          <div className="card rounded-2xl p-5 md:col-span-5 flex flex-col items-center justify-center text-center bg-sienna-wash/20 border-sienna/20">
            <div className="p-2.5 rounded-xl bg-white shadow-md mb-2.5 border border-rim">
              <QRCodeSVG
                value={joinUrl}
                size={96}
                level="M"
                bgColor="#FFFFFF"
                fgColor="#141618"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowQrModal(true)}
                className="btn-ghost text-xs !py-1.5 !px-3 font-semibold flex items-center gap-1.5"
              >
                <QrCode className="w-3.5 h-3.5 text-sienna" />
                <span>Enlarge QR</span>
              </button>

              <button
                onClick={copyJoinLink}
                className="btn-ghost text-xs !py-1.5 !px-2.5"
                title="Copy Direct Join URL"
              >
                {copiedLink ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <LinkIcon className="w-3.5 h-3.5 text-smoke" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-smoke mt-1.5">Scan from mobile camera to join instantly</p>
          </div>
        </div>

        {/* ── Players Roster Card ───────────────────────────────────── */}
        <div className="card rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-sienna" />
              <span className="text-sm font-bold text-alabaster">
                Connected Participants
              </span>
              {isHost && (
                <span className="badge text-[10px] !py-0.5 !px-2 font-bold text-sienna border-sienna/30 bg-sienna-wash/30 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-sienna" />
                  Host Moderation
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isHost && players.some(p => !p.isHost && p.id !== currentUserId) && (
                <span className="text-[10px] text-smoke hidden sm:inline">
                  Tap <span className="text-red-400 font-bold">✕</span> to remove
                </span>
              )}
              <span className="badge">{players.length} / 50 joined</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 min-h-[140px]">
            {players.map((player, i) => {
              const isMe = player.id === currentUserId;
              const canKick = isHost && !player.isHost && player.id !== currentUserId;
              return (
                <motion.div
                  key={player.id}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 24 }}
                  className="relative flex flex-col items-center gap-2 py-4 px-2 rounded-xl border border-rim transition-all hover:border-sienna/40 bg-canvas group"
                >
                  {/* Prominent Visible Kick Button for Host */}
                  {canKick && (
                    <motion.button
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onKickPlayer?.(player.id);
                      }}
                      className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md border-2 border-canvas transition-colors z-20 cursor-pointer"
                      title={`Remove ${player.nickname} from lobby`}
                      aria-label={`Remove ${player.nickname}`}
                    >
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    </motion.button>
                  )}

                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-extrabold text-white shadow-sm"
                    style={{ backgroundColor: player.avatarColor || '#6366f1' }}
                  >
                    {player.nickname[0]?.toUpperCase() || '?'}
                  </div>

                  {/* Nickname display / edit */}
                  {isMe && editingNickname ? (
                    <div className="flex items-center gap-1 w-full px-1">
                      <input
                        type="text"
                        value={tempNickname}
                        onChange={(e) => setTempNickname(e.target.value)}
                        className="w-full text-xs font-semibold text-center bg-transparent border-b border-sienna text-alabaster focus:outline-none focus:border-sienna min-w-0"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            onEditNickname?.(tempNickname);
                            setEditingNickname(false);
                          } else if (e.key === 'Escape') {
                            setEditingNickname(false);
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          onEditNickname?.(tempNickname);
                          setEditingNickname(false);
                        }}
                        className="text-emerald-500 p-0.5 flex-shrink-0"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1 w-full px-1">
                      <span className="text-xs font-semibold truncate text-center text-alabaster">
                        {player.nickname}
                      </span>
                      {isMe && !player.isHost && (
                        <button
                          onClick={() => {
                            setTempNickname(player.nickname);
                            setEditingNickname(true);
                          }}
                          className="text-smoke hover:text-sienna transition-colors opacity-70 hover:opacity-100 flex-shrink-0"
                          title="Edit Nickname"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}

                  {player.isHost && <span className="badge text-[9px] !py-0 !px-1.5 font-bold mt-0.5">HOST</span>}
                  {canKick && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onKickPlayer?.(player.id);
                      }}
                      className="text-[10px] font-semibold text-red-400/80 hover:text-red-400 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Lobby Footer Actions */}
          <div className="mt-7 pt-5 border-t border-rim flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-smoke">
              <Sparkles className="w-4 h-4 text-sienna" />
              <span>Questions will be synchronized across all screens simultaneously.</span>
            </div>

            {isHost ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onStartGame}
                disabled={players.length < 2}
                className="btn-primary !px-8 !py-3 w-full sm:w-auto flex items-center justify-center gap-2 shadow-lg shadow-sienna/25"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Match ({players.length})</span>
              </motion.button>
            ) : (
              <div className="flex items-center justify-center gap-2.5 text-xs font-semibold text-smoke">
                <Loader2 className="w-4 h-4 animate-spin text-sienna" />
                <span>Waiting for host to start the game…</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Large QR Code Modal (for Projector / Big Screen Display) ── */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card rounded-3xl p-8 max-w-sm w-full text-center relative border border-rim shadow-2xl"
              style={{ background: 'var(--color-elevated)' }}
            >
              <h3 className="text-xl font-extrabold text-alabaster mb-1">
                Scan to Join Room
              </h3>
              <p className="text-xs text-smoke mb-6">
                Point your phone camera to join directly
              </p>

              <div className="p-4 rounded-2xl bg-white inline-block shadow-lg mb-6 border border-rim">
                <QRCodeSVG
                  value={joinUrl}
                  size={200}
                  level="H"
                  bgColor="#FFFFFF"
                  fgColor="#141618"
                />
              </div>

              <div className="p-3 rounded-xl bg-canvas border border-rim mb-6">
                <p className="text-[10px] uppercase tracking-wider font-bold text-smoke mb-1">
                  Or Join with PIN
                </p>
                <p className="text-2xl font-black tracking-widest text-sienna">
                  {roomPin}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={copyJoinLink}
                  className="btn-primary text-xs !py-2.5 flex-1 flex items-center justify-center gap-1.5"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <LinkIcon className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Join Link'}</span>
                </button>
                <button
                  onClick={() => setShowQrModal(false)}
                  className="btn-ghost text-xs !py-2.5 px-4"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
