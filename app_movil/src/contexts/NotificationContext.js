import React, { createContext, useState, useEffect, useContext } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_API_URL } from '../services/api';

export const NotificationContext = createContext();

const getWsUrl = (rol, userId) => {
    // Reemplaza http:// o https:// por ws:// o wss://
    const baseUrl = DEFAULT_API_URL.replace(/^http(s?):\/\//i, 'ws$1://');
    return `${baseUrl}/notificaciones/ws/${rol}/${userId}`;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [ws, setWs] = useState(null);

    useEffect(() => {
        let websocket = null;
        
        const connect = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                const rol = await AsyncStorage.getItem('userRole');
                const userId = await AsyncStorage.getItem('userId');
                
                if (token && rol && userId) {
                    const wsUrl = getWsUrl(rol, userId);
                    console.log("Conectando WS a:", wsUrl);
                    websocket = new WebSocket(wsUrl);

                    websocket.onopen = () => {
                        console.log('WS conectado para notificaciones');
                    };

                    websocket.onmessage = (event) => {
                        const data = JSON.parse(event.data);
                        const newNotif = {
                            id: Date.now().toString() + Math.random().toString(),
                            ...data,
                            read: false
                        };
                        setNotifications(prev => [newNotif, ...prev]);
                        setUnreadCount(prev => prev + 1);
                    };

                    websocket.onerror = (e) => {
                        console.log('WS Error:', e.message);
                    };

                    websocket.onclose = () => {
                        console.log('WS Desconectado');
                    };
                    
                    setWs(websocket);
                }
            } catch (e) {
                console.log("Error conectando WS:", e);
            }
        };

        connect();

        return () => {
            if (websocket) {
                websocket.close();
            }
        };
    }, []);

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    const clearAll = () => {
        setNotifications([]);
        setUnreadCount(0);
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAllAsRead, clearAll }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
