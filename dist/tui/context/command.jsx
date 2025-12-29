/* @jsxImportSource solid-js */
/**
 * Command Context Provider
 *
 * Manages the command palette and command registration.
 */
import { createContext, useContext, createSignal } from "solid-js";
const CommandContext = createContext();
export function CommandProvider(props) {
    const [commands, setCommands] = createSignal([]);
    const [isOpen, setIsOpen] = createSignal(false);
    const register = (command) => {
        setCommands((prev) => {
            // Replace if exists, otherwise add
            const exists = prev.findIndex((c) => c.name === command.name);
            if (exists >= 0) {
                const updated = [...prev];
                updated[exists] = command;
                return updated;
            }
            return [...prev, command];
        });
    };
    const unregister = (name) => {
        setCommands((prev) => prev.filter((c) => c.name !== name));
    };
    const execute = async (name) => {
        const command = commands().find((c) => c.name === name);
        if (command) {
            await command.action();
        }
    };
    const search = (query) => {
        if (!query)
            return commands();
        const lowerQuery = query.toLowerCase();
        return commands()
            .filter((c) => c.name.toLowerCase().includes(lowerQuery) ||
            c.label.toLowerCase().includes(lowerQuery) ||
            c.description?.toLowerCase().includes(lowerQuery))
            .sort((a, b) => {
            // Prioritize exact matches
            const aExact = a.name.toLowerCase() === lowerQuery || a.label.toLowerCase() === lowerQuery;
            const bExact = b.name.toLowerCase() === lowerQuery || b.label.toLowerCase() === lowerQuery;
            if (aExact && !bExact)
                return -1;
            if (!aExact && bExact)
                return 1;
            return 0;
        });
    };
    const open = () => setIsOpen(true);
    const close = () => setIsOpen(false);
    return (<CommandContext.Provider value={{
            commands,
            register,
            unregister,
            execute,
            search,
            isOpen,
            open,
            close,
        }}>
      {props.children}
    </CommandContext.Provider>);
}
export function useCommand() {
    const context = useContext(CommandContext);
    if (!context) {
        throw new Error("useCommand must be used within CommandProvider");
    }
    return context;
}
