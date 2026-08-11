import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../contexts/NotificationContext';
import { COLORS } from '../theme';

export default function NotificationButton() {
    const { notifications, unreadCount, markAllAsRead, clearAll } = useNotifications() || { notifications: [], unreadCount: 0 };
    const [modalVisible, setModalVisible] = useState(false);

    const openModal = () => {
        setModalVisible(true);
        markAllAsRead();
    };

    const renderNotification = ({ item }) => (
        <View style={styles.notificationCard}>
            <View style={styles.notifHeader}>
                <Text style={styles.notifTitle}>{item.title}</Text>
                <Text style={styles.notifTime}>{item.time || 'Reciente'}</Text>
            </View>
            <Text style={styles.notifMessage}>{item.message}</Text>
        </View>
    );

    return (
        <>
            <TouchableOpacity onPress={openModal} style={styles.bellButton}>
                <Ionicons name="notifications-outline" size={24} color={COLORS.primary} />
                {unreadCount > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                    </View>
                )}
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <SafeAreaView style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Notificaciones</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={COLORS.textDark} />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={notifications}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={renderNotification}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={
                                <Text style={styles.emptyText}>No tienes notificaciones nuevas</Text>
                            }
                        />

                        {notifications.length > 0 && (
                            <TouchableOpacity style={styles.clearBtn} onPress={clearAll}>
                                <Text style={styles.clearBtnText}>Borrar todas</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </SafeAreaView>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    bellButton: {
        marginRight: 10,
        padding: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badge: {
        position: 'absolute',
        top: 2,
        right: 2,
        backgroundColor: 'red',
        borderRadius: 10,
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.background,
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '70%',
        paddingTop: 20,
        paddingHorizontal: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingBottom: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textDark,
    },
    closeBtn: {
        padding: 5,
    },
    listContent: {
        paddingBottom: 20,
    },
    notificationCard: {
        backgroundColor: COLORS.surface,
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    notifHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    notifTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    notifTime: {
        fontSize: 12,
        color: COLORS.textLight,
    },
    notifMessage: {
        fontSize: 14,
        color: COLORS.textDark,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        color: COLORS.textLight,
        fontSize: 16,
    },
    clearBtn: {
        backgroundColor: COLORS.surface,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    clearBtnText: {
        color: 'red',
        fontWeight: 'bold',
    }
});
