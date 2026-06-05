import { useEffect, useState, useCallback, useReducer } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUserProfile, getSpecificUserProfile } from "../services/UserService";
import {
  sendFriendshipRequest,
  respondFriendshipRequest,
  removeFriendship,
  getFriendshipStatus,
} from "../services/FriendshipService";
import { useAuth } from "../auth/AuthContext";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Spinner from "../components/ui/Spinner";

const getInitials = (name) => (name ? name.slice(0, 2).toUpperCase() : "?");
const BANNER_COLORS = ["bg-coral", "bg-violet", "bg-sky", "bg-butter", "bg-mint"];

// Stato dell'azione di amicizia (in corso + messaggio) raggruppato in un reducer.
const initialAction = { busy: false, msg: "" };
function actionReducer(state, action) {
  switch (action.type) {
    case "start":   return { busy: true, msg: "" };
    case "message": return { ...state, msg: action.msg || "" };
    case "idle":    return { ...state, busy: false };
    default:        return state;
  }
}

export default function ProfilePage() {
  const { userId: usernameParam } = useParams();
  const navigate = useNavigate();
  const { user: me } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [friendship, setFriendship] = useState(null);
  const [action, dispatchAction]    = useReducer(actionReducer, initialAction);

  const isSelf = !usernameParam || (me && usernameParam === me.username);

  const refreshFriendship = useCallback(async (username) => {
    if (isSelf || !username) return;
    const status = await getFriendshipStatus(username);
    if (status?.status) setFriendship(status);
  }, [isSelf]);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const data = isSelf ? await getUserProfile() : await getSpecificUserProfile(usernameParam);
        setProfile(data);
        setError(null);
        if (!isSelf) await refreshFriendship(data.username);
      } catch {
        setError("Errore nel recupero del profilo.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [usernameParam, isSelf, refreshFriendship]);

  const runAction = async (fn, successMsg) => {
    dispatchAction({ type: "start" });
    try {
      const res = await fn();
      if (res?.success === false) dispatchAction({ type: "message", msg: res.message || "Operazione fallita" });
      else {
        dispatchAction({ type: "message", msg: successMsg });
        try { await refreshFriendship(profile.username); } catch { /* */ }
      }
    } catch (err) {
      dispatchAction({ type: "message", msg: err?.message || "Errore di connessione" });
    } finally {
      dispatchAction({ type: "idle" });
    }
  };

  const sendRequest = () => runAction(() => sendFriendshipRequest(profile.username), "Richiesta inviata");
  const acceptRequest = () => runAction(() => respondFriendshipRequest(friendship.friendshipId, "accept"), "Richiesta accettata");
  const rejectRequest = () => runAction(() => respondFriendshipRequest(friendship.friendshipId, "reject"), "Richiesta rifiutata");
  const removeFriend  = () => runAction(() => removeFriendship(profile.username), "Amicizia rimossa");

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 flex flex-col items-center gap-3">
        <Spinner />
        <p className="text-ink-soft">Caricamento profilo…</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <Card className="p-8 text-center">
          <div className="font-display font-extrabold text-xl">{error || "Profilo non trovato"}</div>
        </Card>
      </div>
    );
  }

  const creatorId = profile.id || profile.userId;
  const bannerColor = BANNER_COLORS[(profile.username?.charCodeAt(0) ?? 0) % BANNER_COLORS.length];

  const renderFriendshipActions = () => {
    if (isSelf || !friendship) return null;
    switch (friendship.status) {
      case "accepted":
        return <Button variant="outline" onClick={removeFriend} disabled={action.busy}>Rimuovi amicizia</Button>;
      case "pending_sent":
        return <Button variant="secondary" disabled>Richiesta inviata</Button>;
      case "pending_received":
        return (
          <>
            <Button onClick={acceptRequest} disabled={action.busy}>Accetta</Button>
            <Button variant="outline" onClick={rejectRequest} disabled={action.busy}>Rifiuta</Button>
          </>
        );
      default:
        return <Button onClick={sendRequest} disabled={action.busy}>Aggiungi amico</Button>;
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <Card>
        {/* Header con banner */}
        <div
          className={`${bannerColor} p-6 flex items-center gap-4 border-b-3 border-ink`}
          style={{ backgroundImage: "repeating-linear-gradient(135deg, rgba(0,0,0,.1) 0 16px, transparent 16px 34px)" }}
        >
          <div className="w-16 h-16 rounded-full bg-white border-3 border-ink grid place-items-center font-display font-extrabold text-xl shrink-0">
            {getInitials(profile.username)}
          </div>
          <div>
            <h2 className="font-display font-extrabold text-2xl leading-tight">{profile.username}</h2>
            <p className="text-sm text-ink-soft">{isSelf ? "Il tuo profilo" : "Profilo pubblico"}</p>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="px-6 py-4 border-b-2 border-ink/10">
            <div className="font-semibold">{profile.bio}</div>
          </div>
        )}

        {/* Email (solo self) */}
        {isSelf && profile.email && (
          <div className="px-6 py-4 border-b-2 border-ink/10">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-ink-soft mb-1">Email</div>
            <div className="font-bold break-all">{profile.email}</div>
          </div>
        )}

        {/* Azioni */}
        <div className="p-6">
          <h2 className="font-display font-extrabold text-lg mb-4">Azioni profilo</h2>
          <div className="flex gap-3 flex-wrap">
            <Button onClick={() => navigate(`/users/${creatorId}/quizzes`)}>Vedi Quiz</Button>
            {isSelf ? (
              <Button variant="secondary" onClick={() => navigate("/settings")}>Impostazioni account</Button>
            ) : renderFriendshipActions()}
          </div>
          {action.msg && <p className="mt-3 text-sm text-ink-soft">{action.msg}</p>}
        </div>
      </Card>
    </div>
  );
}
