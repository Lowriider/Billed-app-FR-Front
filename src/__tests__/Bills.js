/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import {bills} from "../fixtures/bills.js"
import {ROUTES, ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";

import router from "../app/Router.js";
import mockStore from "../__mocks__/store";
import userEvent from "@testing-library/user-event";
import Bills from "../containers/Bills";

describe("Given I am connected as an employee", () => {
    describe("When I am on Bills Page", () => {
        test("Then bill icon in vertical layout should be highlighted", async () => {

            Object.defineProperty(window, 'localStorage', {value: localStorageMock})
            window.localStorage.setItem('user', JSON.stringify({
                type: 'Employee'
            }))
            const root = document.createElement("div")
            root.setAttribute("id", "root")
            document.body.append(root)
            router()
            window.onNavigate(ROUTES_PATH.Bills)
            await waitFor(() => screen.getByTestId('icon-window'))
            const windowIcon = screen.getByTestId('icon-window')
            expect(windowIcon.getElementsByClassName('"active-icon"')).toBeTruthy()

        })
        test("then the loader must appear before the tickets are displayed", () => {
            document.body.innerHTML = BillsUI({loading: true})
            expect(screen.getAllByText("Loading...")).toBeTruthy()
        })
        test("Then bills should be ordered from earliest to latest", () => {
            document.body.innerHTML = BillsUI({data: bills})
            const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
            const antiChrono = (a, b) => ((a < b) ? 1 : -1)
            const datesSorted = [...dates].sort(antiChrono)
            expect(dates).toEqual(datesSorted)
        })
        describe('When I click on the icon eye', () => {
            test('A modal should open', () => {
                Object.defineProperty(window, 'localStorage', {value: localStorageMock})
                window.localStorage.setItem('user', JSON.stringify({
                    type: 'Employee'
                }))
                document.body.innerHTML = BillsUI({data: bills})
                const onNavigate = (pathname) => {
                    document.body.innerHTML = ROUTES({pathname})
                }
                const store = null
                const billsClass = new Bills({
                    document, onNavigate, store, bills, localStorage: window.localStorage
                })

                $.fn.modal = jest.fn();

                const eye = screen.getAllByTestId('icon-eye')[0];
                const handleClickIconEye = jest.fn(() => {
                    billsClass.handleClickIconEye
                });
                eye.addEventListener("click", handleClickIconEye);
                userEvent.click(eye);
                expect(handleClickIconEye).toHaveBeenCalled();

                expect($.fn.modal).toBeTruthy();
            })
        })
        describe('When I click on new bill button', () => {
            test('I should land on newBills page', () => {
                Object.defineProperty(window, 'localStorage', {value: localStorageMock})
                window.localStorage.setItem('user', JSON.stringify({
                    type: 'Employee'
                }))
                document.body.innerHTML = BillsUI({data: bills})
                const onNavigate = (pathname) => {
                    document.body.innerHTML = ROUTES({pathname})
                }
                const store = null
                const billsClass = new Bills({
                    document, onNavigate, store, bills, localStorage: window.localStorage
                })
                const newBillsButton = screen.getByTestId("btn-new-bill")
                const handleClickOnNewBill = jest.fn(() => {
                    billsClass.handleClickNewBill()
                });
                newBillsButton.addEventListener('click', handleClickOnNewBill)
                userEvent.click(newBillsButton)
                expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy();
            })
        })
    })
})
describe("Given I am a user connected as Employee", () => {
    describe("When I navigate to Bills", () => {
        beforeEach(() => {
            jest.spyOn(mockStore, "bills")
            Object.defineProperty(
                window,
                'localStorage',
                {value: localStorageMock}
            )
            window.localStorage.setItem('user', JSON.stringify({
                type: 'Employee',
                email: "a@a"
            }))
            const root = document.createElement("div")
            root.setAttribute("id", "root")
            document.body.appendChild(root)
            router()
        })

        test("fetches bills from mock API GET", async () => {
            const getSpy = jest.spyOn(mockStore, "bills")
            const getBills = await mockStore.bills().list()
            expect(getSpy).toHaveBeenCalledTimes(1)
            expect(getBills.length).toBe(4)
        })

        describe("When an error occurs on API", () => {
            test("fetches bills from an API and fails with 404 message error", async () => {
                document.body.innerHTML = BillsUI({error: "Erreur 404"})
                mockStore.bills.mockImplementationOnce(() => {
                    return {
                        list: () => {
                            return Promise.reject(new Error("Erreur 404"))
                        }
                    }
                })
                window.onNavigate(ROUTES_PATH.Bills)
                await new Promise(process.nextTick);
                const message = await screen.getByText(/Erreur 404/)
                expect(message).toBeTruthy()
            })

            test("fetches messages from an API and fails with 500 message error", async () => {
                document.body.innerHTML = BillsUI({error: "Erreur 500"})
                mockStore.bills.mockImplementationOnce(() => {
                    return {
                        list: () => {
                            return Promise.reject(new Error("Erreur 500"))
                        }
                    }
                })

                window.onNavigate(ROUTES_PATH.Bills)
                await new Promise(process.nextTick);
                const message = await screen.getByText(/Erreur 500/)
                expect(message).toBeTruthy()
            })
        })
    })
})
