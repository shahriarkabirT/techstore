import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IMessage } from '@/models/ChatSession';

interface ChatState {
    isOpen: boolean;
    identity: {
        name: string;
        phone: string;
        email?: string;
    } | null;
    sessionId: string | null;
    messages: IMessage[];
    isConnected: boolean;
    status: 'active' | 'closed' | null;
}

const initialState: ChatState = {
    isOpen: false,
    identity: null,
    sessionId: null,
    messages: [],
    isConnected: false,
    status: null,
};

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        toggleChat: (state) => {
            state.isOpen = !state.isOpen;
        },
        setIdentity: (state, action: PayloadAction<ChatState['identity']>) => {
            state.identity = action.payload;
        },
        setSessionId: (state, action: PayloadAction<string>) => {
            state.sessionId = action.payload;
        },
        addMessage: (state, action: PayloadAction<IMessage>) => {
            state.messages.push(action.payload);
        },
        setMessages: (state, action: PayloadAction<IMessage[]>) => {
            state.messages = action.payload;
        },
        setConnected: (state, action: PayloadAction<boolean>) => {
            state.isConnected = action.payload;
        },
        setStatus: (state, action: PayloadAction<'active' | 'closed' | null>) => {
            state.status = action.payload;
        },
        clearChat: (state) => {
            state.sessionId = null;
            state.messages = [];
            state.identity = null;
            state.status = null;
        }
    },
});

export const {
    toggleChat,
    setIdentity,
    setSessionId,
    addMessage,
    setMessages,
    setConnected,
    setStatus,
    clearChat
} = chatSlice.actions;

export default chatSlice.reducer;
