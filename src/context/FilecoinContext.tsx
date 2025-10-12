import { createContext, useContext, useReducer, Dispatch, ReactNode } from 'react';

// 1. Define types for your state, actions, and the context value
interface State {
  walletAddress: string | null;
  isConnected: boolean;
  storageDeals: any[]; // Replace 'any' with a specific Deal type if you have one
  complianceLogs: any[]; // Replace 'any' with a specific Log type
}

type Action =
  | { type: 'SET_WALLET'; payload: string }
  | { type: 'ADD_DEAL'; payload: any } // Use a specific Deal type
  | { type: 'ADD_LOG'; payload: any }; // Use a specific Log type

interface FilecoinContextType {
  state: State;
  dispatch: Dispatch<Action>;
}

// 2. Create the context with a type and a default value of `undefined`
const FilecoinContext = createContext<FilecoinContextType | undefined>(undefined);

const initialState: State = {
  walletAddress: null,
  isConnected: false,
  storageDeals: [],
  complianceLogs: []
};

// 3. Add the new types to your reducer
function filecoinReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_WALLET':
      return { ...state, walletAddress: action.payload, isConnected: true };
    case 'ADD_DEAL':
      return { ...state, storageDeals: [...state.storageDeals, action.payload] };
    case 'ADD_LOG':
      return { ...state, complianceLogs: [...state.complianceLogs, action.payload] };
    default:
      return state;
  }
}

// 4. Type the `children` prop in your provider
export const FilecoinProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(filecoinReducer, initialState);

  return (
    <FilecoinContext.Provider value={{ state, dispatch }}>
      {children}
    </FilecoinContext.Provider>
  );
};

// Custom hook to use the context
export const useFilecoin = (): FilecoinContextType => {
  const context = useContext(FilecoinContext);
  if (context === undefined) {
    throw new Error('useFilecoin must be used within a FilecoinProvider');
  }
  return context;
};