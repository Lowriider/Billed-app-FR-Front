/**
 * @jest-environment jsdom
 */

import {fireEvent, screen} from "@testing-library/dom"
import '@testing-library/jest-dom';
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import userEvent from "@testing-library/user-event";
import {ROUTES} from "../constants/routes";
import mockStore from "../__mocks__/store";
import {localStorageMock} from "../__mocks__/localStorage";
import router from "../app/Router";


describe("Given I am connected as an employee", () => {
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
  describe("When I am on NewBill Page", () => {
    test("Then ...", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      //to-do write assertion
    })
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
    test("Then the value of input's file  should be empty and an error message should be visible", () => {
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
    test("Then the file name should be displayed into the input", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({pathname})
      };

      document.body.innerHTML = html
      const newBills = new NewBill({document, onNavigate, localStorage: window.localStorage})

      const handleChangeFile = jest.fn((e) => newBills.handleChangeFile)
      const fileInput = screen.getByTestId('file')

      fileInput.addEventListener("change", handleChangeFile)
      fireEvent.change(fileInput, { target: { files: [new File(['proof.jpg'], 'proof.jpg', {type: 'proof/jpg'})]}})


      expect(handleChangeFile).toHaveBeenCalled();
      expect(fileInput.files[0].name).toBe("proof.jpg");
    });
  })
  describe("When I click on submitForm button", () => {
    test("Then, I should land on Bills page", () => {

      const onNavigate = (pathname) => {document.body.innerHTML = ROUTES({ pathname })}

      const html = NewBillUI()
      document.body.innerHTML = html
      const newBills = new NewBill({document, onNavigate, localStorage: window.localStorage})

      const handleSubmit = jest.fn((e) => newBills.handleSubmit)
      const newBillForm = screen.getByTestId('form-new-bill')

      newBillForm.addEventListener("submit", handleSubmit)
      fireEvent.submit(newBillForm)

      expect(handleSubmit).toHaveBeenCalled()
      expect(screen.getAllByText('Mes notes de frais')).toBeTruthy()
    })
  })
})
