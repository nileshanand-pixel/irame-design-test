import { SESSION_TIME_IN_MILISECONDS, USER_SESSION_ID } from "@/constants/session-manager.constant";
import { getCookie, updateCookieExpiration } from "@/utils/cookies";
import { createSession } from "@/utils/session-manager";
import { useEffect } from "react";
import { useIdleTimer } from "react-idle-timer";

export default function SessionManager() {
    const onActive = () => {
        createSession();
    }

    const onAction = () => {
        updateCookieExpiration(USER_SESSION_ID);
    }
    
    useIdleTimer({
        onActive,
        onAction, 
        timeout: SESSION_TIME_IN_MILISECONDS,
        // timeout: 5000, // for testing
        crossTab: true,
        leaderElection: true,
        syncTimers: 2000,
        events: ["click", "mousemove", "keydown", "scroll"],
    })

    useEffect(() => {
        const user_session_id = getCookie(USER_SESSION_ID);

        if(!user_session_id) {
            createSession();
        }
    }, []);

    return null;
}