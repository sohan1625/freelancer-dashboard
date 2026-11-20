import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import React from "react";

import Index from "./pages/Index.tsx";
import InvoicesPage from "@/pages/Invoices";
import RecurringInvoicesPage from "@/pages/RecurringInvoices";
import Clients from "./pages/Clients.tsx";
import ClientDetail from "./pages/ClientDetail.tsx";
import Projects from "./pages/Projects.tsx";
import Expenses from "./pages/Expenses.tsx";
import Reports from "./pages/Reports.tsx";
import Settings from "./pages/Settings.tsx";
import NotFound from "./pages/NotFound.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import ClientPortal from "./pages/ClientPortal.tsx";

const queryClient = new QueryClient();

function RequireAuth({ children }: { children: React.ReactNode }) {
    const token = localStorage.getItem("accessToken");
    if (!token) return <Navigate to="/login" replace />;
    return <>{children}</>;
}

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Toaster richColors position="top-right" closeButton />

                <Routes>
                    {/* PUBLIC */}
                    <Route
                        path="/login"
                        element={
                            localStorage.getItem("accessToken")
                                ? <Navigate to="/" replace />
                                : <Login />
                        }
                    />
                    <Route
                        path="/register"
                        element={
                            localStorage.getItem("accessToken")
                                ? <Navigate to="/" replace />
                                : <Register />
                        }
                    />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/portal/:token" element={<ClientPortal />} />

                    {/* PROTECTED */}
                    <Route path="/" element={<RequireAuth><Index /></RequireAuth>} />
                    <Route path="/clients" element={<RequireAuth><Clients /></RequireAuth>} />
                    <Route path="/clients/:id" element={<RequireAuth><ClientDetail /></RequireAuth>} />
                    <Route path="/invoices" element={<RequireAuth><InvoicesPage /></RequireAuth>} />
                    <Route path="/recurring-invoices" element={<RequireAuth><RecurringInvoicesPage /></RequireAuth>} />
                    <Route path="/projects" element={<RequireAuth><Projects /></RequireAuth>} />
                    <Route path="/expenses" element={<RequireAuth><Expenses /></RequireAuth>} />
                    <Route path="/reports" element={<RequireAuth><Reports /></RequireAuth>} />
                    <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />

                    {/* 404 */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </BrowserRouter>
        </QueryClientProvider>
    );
}