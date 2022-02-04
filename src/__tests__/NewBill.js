/**
 * @jest-environment jsdom
 */

import {fireEvent, screen, waitFor} from "@testing-library/dom"
import '@testing-library/jest-dom';
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import userEvent from "@testing-library/user-event";
import {ROUTES, ROUTES_PATH} from "../constants/routes";
import mockStore from "../__mocks__/store";
import {localStorageMock} from "../__mocks__/localStorage";
import router from "../app/Router";
import {bills} from "../fixtures/bills"
import BillsUI from "../views/BillsUI";


describe("Given I am connected as an employee", () => {
    describe("When I am on NewBill Page", () => {
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
            window.onNavigate(ROUTES_PATH.NewBill)
        })
        describe("When I do not fill fields and I click on send button", () => {
            test("Then It should renders NewBill page", () => {
                const inputName = screen.getByTestId("expense-name");
                expect(inputName.getAttribute("placeholder")).toBe("Vol Paris Londres");
                expect(inputName.value).toBe("");

                const inputDate = screen.getByTestId("datepicker");
                expect(inputDate.value).toBe("");

                const inputAmount = screen.getByTestId("amount");
                expect(inputAmount.getAttribute("placeholder")).toBe("348");
                expect(inputAmount.value).toBe("");

                const inputVat = screen.getByTestId("vat");
                expect(inputVat.getAttribute("placeholder")).toBe("70");
                expect(inputVat.value).toBe("");

                const inputPct = screen.getByTestId("pct");
                expect(inputPct.getAttribute("placeholder")).toBe("20");
                expect(inputPct.value).toBe("");

                const inputComment = screen.getByTestId("commentary");
                expect(inputComment.value).toBe("");

                const inputFile = screen.getByTestId("file");
                expect(inputFile.value).toBe("");

                const form = screen.getByTestId("form-new-bill");
                userEvent.click(form);
                expect(screen.getByTestId("form-new-bill")).toBeTruthy();
            })
        });
        describe("when I select a file whose format is not accepted", () => {
            test("Then inputFile should reset and an error message should be visible", () => {
                const newBill = new NewBill({
                    document,
                });
                const inputData = {
                    file: "pdf.pdf",
                };

                const handleChangeFile = jest.fn(newBill.handleChangeFile);
                const inputFile = screen.getByTestId("file");
                inputFile.addEventListener("change", handleChangeFile);

                fireEvent.change(inputFile, {
                    target: {
                        files: [
                            new File(["image"], inputData.file, {
                                type: "application/pdf",
                            }),
                        ],
                    },
                });
                const errorBlock = screen.getByTestId("errorFile")
                expect(errorBlock).toBeVisible()
            });
        });
        describe("When I upload an image in file input", () => {
            test("Then the file name should render into inputFile", async () => {
                const onNavigate = (pathname) => {
                    document.body.innerHTML = ROUTES({pathname});
                };

                const mockStore = {
                    bills: jest.fn(() => newBill.store),
                    create: jest.fn(() => Promise.resolve({})),
                };

                const newBill = new NewBill({
                    document,
                    onNavigate,
                    store: mockStore,
                    localStorage: window.localStorage,
                });

                // Mocks
                const handleStore = jest.fn((e) => newBill.handleStore);
                const handleChangeFile = jest.fn((e) => newBill.handleChangeFile);

                const inputFile = screen.getByTestId("file");
                inputFile.addEventListener('change', handleChangeFile)
                fireEvent.change(inputFile, {
                    target: {
                        files: [new File(["file.jpg"], "file.jpg", {type: "file/jpg"})],
                    },
                });

                expect(inputFile.files[0].name).toBe("file.jpg");
                await waitFor(() =>
                    expect(handleChangeFile).toHaveBeenCalled()
                );
                handleStore();
                await waitFor(() => {
                        expect(handleStore).toHaveBeenCalled()
                    }
                );

            });
        })
        describe("When I click on submitForm button", () => {
            test("Then, I should land on Bills page", () => {

                const onNavigate = (pathname) => {
                    document.body.innerHTML = ROUTES({pathname})
                }

                const newBills = new NewBill({document, onNavigate, localStorage: window.localStorage})

                const handleSubmit = jest.fn((e) => newBills.handleSubmit)
                const newBillForm = screen.getByTestId('form-new-bill')

                newBillForm.addEventListener("submit", handleSubmit)
                fireEvent.submit(newBillForm)

                expect(handleSubmit).toHaveBeenCalled()
                expect(screen.getAllByText('Mes notes de frais')).toBeTruthy()
            })
        })
        describe("Given I am a user connected as Employee", () => {
            describe("When I post a newBill", () => {
                test("Then newBill should be equal to mockstore update example", async () => {
                    const getSpy = jest.spyOn(mockStore, 'bills')
                    const newBill = {
                        "id": "47qAXb6fIm2zOKkLzMro",
                        "vat": "80",
                        "fileUrl": "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
                        "status": "pending",
                        "type": "Hôtel et logement",
                        "commentary": "séminaire billed",
                        "name": "encore",
                        "fileName": "preview-facture-free-201801-pdf-1.jpg",
                        "date": "2004-04-04",
                        "amount": 400,
                        "commentAdmin": "ok",
                        "email": "a@a",
                        "pct": 20
                    };
                    const postBills = await mockStore.bills().update(newBill)
                    expect(getSpy).toHaveBeenCalledTimes(1);
                    expect(postBills).toStrictEqual(newBill)
                });

                test("Then should fails with 404 message error", async () => {
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
                });
                test("Then should fails with 500 message error", async () => {
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
                });
            });
        });
    })
})
