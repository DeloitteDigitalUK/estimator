import { expect } from 'chai';
import validators, { rowValidator as $v } from './validators';

describe('Table validators', () => {

    describe("rowValidator", () => {

        const failingValidator = (value, callback) => { callback(false); };

        it("skips spare row", () => {
            const mockContext = {
                instance: {
                    countRows() {
                        return 3;
                    },
                    getSettings() {
                        return {minSpareRows: 1}
                    },
                    getDataAtCell(i, col) {
                        return "cell" + i;
                    }
                },
                row: 2, // third row of three = spare row
                col: 0
            };

            $v(failingValidator).bind(mockContext)(null, res => {
                expect(res).to.be.true;
            });
        });

        it("doesn't skip other row", () => {
            const mockContext = {
                instance: {
                    countRows() {
                        return 3;
                    },
                    getSettings() {
                        return {minSpareRows: 1}
                    },
                    getDataAtCell(i, col) {
                        return "cell" + i;
                    }
                },
                row: 1, // third row of three = spare row
                col: 0
            };

            $v(failingValidator).bind(mockContext)(null, res => {
                expect(res).to.be.false;
            });
        });

    });

    describe("required", () => {

        it("null", () => {
            validators.required(null, res => {
                expect(res).to.be.false;
            });
        });

        it("undefined", () => {
            validators.required(undefined, res => {
                expect(res).to.be.false;
            });
        });

        it("empty string", () => {
            validators.required("", res => {
                expect(res).to.be.false;
            });
        });

        it("[]", () => {
            validators.required([], res => {
                expect(res).to.be.false;
            });
        });

        it("{}", () => {
            validators.required(null, res => {
                expect(res).to.be.false;
            });
        });

        it("number", () => {
            validators.required(1, res => {
                expect(res).to.be.true;
            });
        });

        it("zero", () => {
            validators.required(0, res => {
                expect(res).to.be.true;
            });
        });

        it("true", () => {
            validators.required(true, res => {
                expect(res).to.be.true;
            });
        });

        it("false", () => {
            validators.required(false, res => {
                expect(res).to.be.true;
            });
        });

        it("date", () => {
            validators.required(new Date(), res => {
                expect(res).to.be.true;
            });
        });


    });

    describe("number", () => {

        it("null", () => {
            validators.number(null, res => {
                expect(res).to.be.true;
            });
        });

        it("undefined", () => {
            validators.number(undefined, res => {
                expect(res).to.be.true;
            });
        });

        it("empty string", () => {
            validators.number("", res => {
                expect(res).to.be.true;
            });
        });

        it("0", () => {
            validators.number(0, res => {
                expect(res).to.be.true;
            });
        });

        it("-1", () => {
            validators.number(-1, res => {
                expect(res).to.be.true;
            });
        });

        it("1", () => {
            validators.number(1, res => {
                expect(res).to.be.true;
            });
        });

        it("string", () => {
            validators.number("string", res => {
                expect(res).to.be.false;
            });
        });

        it("NaN", () => {
            validators.number(NaN, res => {
                expect(res).to.be.false;
            });
        });

        it("[]", () => {
            validators.number([], res => {
                expect(res).to.be.false;
            });
        });

        it("{}", () => {
            validators.number({}, res => {
                expect(res).to.be.false;
            });
        });

    });

    describe("requiredNumber", () => {

        it("null", () => {
            validators.requiredNumber(null, res => {
                expect(res).to.be.false;
            });
        });

        it("undefined", () => {
            validators.requiredNumber(undefined, res => {
                expect(res).to.be.false;
            });
        });

        it("empty string", () => {
            validators.requiredNumber("", res => {
                expect(res).to.be.false;
            });
        });

        it("0", () => {
            validators.requiredNumber(0, res => {
                expect(res).to.be.true;
            });
        });

        it("-1", () => {
            validators.requiredNumber(-1, res => {
                expect(res).to.be.true;
            });
        });

        it("1", () => {
            validators.requiredNumber(1, res => {
                expect(res).to.be.true;
            });
        });

        it("string", () => {
            validators.requiredNumber("string", res => {
                expect(res).to.be.false;
            });
        });

        it("NaN", () => {
            validators.requiredNumber(NaN, res => {
                expect(res).to.be.false;
            });
        });

        it("[]", () => {
            validators.requiredNumber([], res => {
                expect(res).to.be.false;
            });
        });

        it("{}", () => {
            validators.requiredNumber({}, res => {
                expect(res).to.be.false;
            });
        });

    });

    describe("positiveNumber", () => {

        it("null", () => {
            validators.positiveNumber(null, res => {
                expect(res).to.be.true;
            });
        });

        it("undefined", () => {
            validators.positiveNumber(undefined, res => {
                expect(res).to.be.true;
            });
        });

        it("empty string", () => {
            validators.positiveNumber("", res => {
                expect(res).to.be.true;
            });
        });

        it("0", () => {
            validators.positiveNumber(0, res => {
                expect(res).to.be.false;
            });
        });

        it("-1", () => {
            validators.positiveNumber(-1, res => {
                expect(res).to.be.false;
            });
        });

        it("-1.1", () => {
            validators.positiveNumber(-1.1, res => {
                expect(res).to.be.false;
            });
        });

        it("1", () => {
            validators.positiveNumber(1, res => {
                expect(res).to.be.true;
            });
        });

        it("0.1", () => {
            validators.positiveNumber(0.1, res => {
                expect(res).to.be.true;
            });
        });

        it("string", () => {
            validators.positiveNumber("string", res => {
                expect(res).to.be.false;
            });
        });

        it("NaN", () => {
            validators.positiveNumber(NaN, res => {
                expect(res).to.be.false;
            });
        });

        it("[]", () => {
            validators.positiveNumber([], res => {
                expect(res).to.be.false;
            });
        });

        it("{}", () => {
            validators.positiveNumber({}, res => {
                expect(res).to.be.false;
            });
        });

    });

    describe("positiveInteger", () => {

        it("null", () => {
            validators.positiveInteger(null, res => {
                expect(res).to.be.true;
            });
        });

        it("undefined", () => {
            validators.positiveInteger(undefined, res => {
                expect(res).to.be.true;
            });
        });

        it("empty string", () => {
            validators.positiveInteger("", res => {
                expect(res).to.be.true;
            });
        });

        it("0", () => {
            validators.positiveInteger(0, res => {
                expect(res).to.be.false;
            });
        });

        it("-1", () => {
            validators.positiveInteger(-1, res => {
                expect(res).to.be.false;
            });
        });

        it("-1.1", () => {
            validators.positiveInteger(-1.1, res => {
                expect(res).to.be.false;
            });
        });

        it("1", () => {
            validators.positiveInteger(1, res => {
                expect(res).to.be.true;
            });
        });

        it("0.1", () => {
            validators.positiveInteger(0.1, res => {
                expect(res).to.be.false;
            });
        });

        it("string", () => {
            validators.positiveInteger("string", res => {
                expect(res).to.be.false;
            });
        });

        it("NaN", () => {
            validators.positiveInteger(NaN, res => {
                expect(res).to.be.false;
            });
        });

        it("[]", () => {
            validators.positiveInteger([], res => {
                expect(res).to.be.false;
            });
        });

        it("{}", () => {
            validators.positiveInteger({}, res => {
                expect(res).to.be.false;
            });
        });

    });

    describe("requiredPositiveInteger", () => {

        it("null", () => {
            validators.requiredPositiveInteger(null, res => {
                expect(res).to.be.false;
            });
        });

        it("undefined", () => {
            validators.requiredPositiveInteger(undefined, res => {
                expect(res).to.be.false;
            });
        });

        it("empty string", () => {
            validators.requiredPositiveInteger("", res => {
                expect(res).to.be.false;
            });
        });

        it("0", () => {
            validators.requiredPositiveInteger(0, res => {
                expect(res).to.be.false;
            });
        });

        it("-1", () => {
            validators.requiredPositiveInteger(-1, res => {
                expect(res).to.be.false;
            });
        });

        it("-1.1", () => {
            validators.requiredPositiveInteger(-1.1, res => {
                expect(res).to.be.false;
            });
        });

        it("1", () => {
            validators.requiredPositiveInteger(1, res => {
                expect(res).to.be.true;
            });
        });

        it("0.1", () => {
            validators.requiredPositiveInteger(0.1, res => {
                expect(res).to.be.false;
            });
        });

        it("string", () => {
            validators.requiredPositiveInteger("string", res => {
                expect(res).to.be.false;
            });
        });

        it("NaN", () => {
            validators.requiredPositiveInteger(NaN, res => {
                expect(res).to.be.false;
            });
        });

        it("[]", () => {
            validators.requiredPositiveInteger([], res => {
                expect(res).to.be.false;
            });
        });

        it("{}", () => {
            validators.requiredPositiveInteger({}, res => {
                expect(res).to.be.false;
            });
        });

    });

    describe("percentage", () => {

        it("null", () => {
            validators.percentage(null, res => {
                expect(res).to.be.true;
            });
        });

        it("undefined", () => {
            validators.percentage(undefined, res => {
                expect(res).to.be.true;
            });
        });

        it("empty string", () => {
            validators.percentage("", res => {
                expect(res).to.be.true;
            });
        });

        it("0", () => {
            validators.percentage(0, res => {
                expect(res).to.be.true;
            });
        });

        it("-1", () => {
            validators.percentage(-1, res => {
                expect(res).to.be.false;
            });
        });

        it("1", () => {
            validators.percentage(1, res => {
                expect(res).to.be.true;
            });
        });

        it("100", () => {
            validators.percentage(100, res => {
                expect(res).to.be.false;
            });
        });

        it("1.1", () => {
            validators.percentage(1.1, res => {
                expect(res).to.be.false;
            });
        });

        it("string", () => {
            validators.percentage("string", res => {
                expect(res).to.be.false;
            });
        });

        it("NaN", () => {
            validators.percentage(NaN, res => {
                expect(res).to.be.false;
            });
        });

        it("[]", () => {
            validators.percentage([], res => {
                expect(res).to.be.false;
            });
        });

        it("{}", () => {
            validators.percentage({}, res => {
                expect(res).to.be.false;
            });
        });

    });

    describe("requiredPercentage", () => {

        it("null", () => {
            validators.requiredPercentage(null, res => {
                expect(res).to.be.false;
            });
        });

        it("undefined", () => {
            validators.requiredPercentage(undefined, res => {
                expect(res).to.be.false;
            });
        });

        it("empty string", () => {
            validators.requiredPercentage("", res => {
                expect(res).to.be.false;
            });
        });

        it("0", () => {
            validators.requiredPercentage(0, res => {
                expect(res).to.be.true;
            });
        });

        it("-1", () => {
            validators.requiredPercentage(-1, res => {
                expect(res).to.be.false;
            });
        });

        it("1", () => {
            validators.requiredPercentage(1, res => {
                expect(res).to.be.true;
            });
        });

        it("100", () => {
            validators.requiredPercentage(100, res => {
                expect(res).to.be.false;
            });
        });

        it("1.1", () => {
            validators.requiredPercentage(101, res => {
                expect(res).to.be.false;
            });
        });

        it("string", () => {
            validators.requiredPercentage("string", res => {
                expect(res).to.be.false;
            });
        });

        it("NaN", () => {
            validators.requiredPercentage(NaN, res => {
                expect(res).to.be.false;
            });
        });

        it("[]", () => {
            validators.requiredPercentage([], res => {
                expect(res).to.be.false;
            });
        });

        it("{}", () => {
            validators.requiredPercentage({}, res => {
                expect(res).to.be.false;
            });
        });

    });

    describe("date", () => {

        it("null", () => {
            validators.date.bind({
                dateFormat: "DD/MM/YYYY"
            })(null, res => {
                expect(res).to.be.true;
            });
        });

        it("undefined", () => {
            validators.date.bind({
                dateFormat: "DD/MM/YYYY"
            })(undefined, res => {
                expect(res).to.be.true;
            });
        });

        it("empty string", () => {
            validators.date.bind({
                dateFormat: "DD/MM/YYYY"
            })("", res => {
                expect(res).to.be.true;
            });
        });

        it("non-empty string", () => {
            validators.date.bind({
                dateFormat: "DD/MM/YYYY"
            })("foo", res => {
                expect(res).to.be.false;
            });
        });

        it("0", () => {
            validators.date.bind({
                dateFormat: "DD/MM/YYYY"
            })(0, res => {
                expect(res).to.be.false;
            });
        });

        it("date string", () => {
            validators.date.bind({
                dateFormat: "DD/MM/YYYY"
            })("31/01/2010", res => {
                expect(res).to.be.true;
            });
        });

        it("invalid date string", () => {
            validators.date.bind({
                dateFormat: "DD/MM/YYYY"
            })("01/31/2010", res => {
                expect(res).to.be.false;
            });
        });

        it("NaN", () => {
            validators.date.bind({
                dateFormat: "DD/MM/YYYY"
            })(NaN, res => {
                expect(res).to.be.false;
            });
        });

        it("[]", () => {
            validators.date.bind({
                dateFormat: "DD/MM/YYYY"
            })([], res => {
                expect(res).to.be.false;
            });
        });

        it("{}", () => {
            validators.date.bind({
                dateFormat: "DD/MM/YYYY"
            })({}, res => {
                expect(res).to.be.false;
            });
        });

    });

    describe("requiredDate", () => {

        it("null", () => {
            validators.requiredDate.bind({
                dateFormat: "DD/MM/YYYY"
            })(null, res => {
                expect(res).to.be.false;
            });
        });

        it("undefined", () => {
            validators.requiredDate.bind({
                dateFormat: "DD/MM/YYYY"
            })(undefined, res => {
                expect(res).to.be.false;
            });
        });

        it("empty string", () => {
            validators.requiredDate.bind({
                dateFormat: "DD/MM/YYYY"
            })("", res => {
                expect(res).to.be.false;
            });
        });

        it("non-empty string", () => {
            validators.requiredDate.bind({
                dateFormat: "DD/MM/YYYY"
            })("test", res => {
                expect(res).to.be.false;
            });
        });

        it("0", () => {
            validators.requiredDate.bind({
                dateFormat: "DD/MM/YYYY"
            })(0, res => {
                expect(res).to.be.false;
            });
        });

        it("date string", () => {
            validators.requiredDate.bind({
                dateFormat: "DD/MM/YYYY"
            })("31/01/2010", res => {
                expect(res).to.be.true;
            });
        });

        it("invalid date string", () => {
            validators.requiredDate.bind({
                dateFormat: "DD/MM/YYYY"
            })("01/31/2010", res => {
                expect(res).to.be.false;
            });
        });

        it("NaN", () => {
            validators.requiredDate.bind({
                dateFormat: "DD/MM/YYYY"
            })(NaN, res => {
                expect(res).to.be.false;
            });
        });

        it("[]", () => {
            validators.requiredDate.bind({
                dateFormat: "DD/MM/YYYY"
            })([], res => {
                expect(res).to.be.false;
            });
        });

        it("{}", () => {
            validators.requiredDate.bind({
                dateFormat: "DD/MM/YYYY"
            })({}, res => {
                expect(res).to.be.false;
            });
        });

    });

    describe("unique", () => {

        const mockContext = {
            instance: {
                countRows() {
                    return 3;
                },
                getSettings() {
                    return {minSpareRows: 1}
                },
                getDataAtCell(i, col) {
                    return "cell" + i;
                }
            },
            row: 0,
            col: 0
        };

        it("null", () => {
            validators.unique.bind(mockContext)(null, res => {
                expect(res).to.be.false;
            });
        });

        it("undefined", () => {
            validators.unique.bind(mockContext)(undefined, res => {
                expect(res).to.be.false;
            });
        });

        it("empty string", () => {
            validators.unique.bind(mockContext)("", res => {
                expect(res).to.be.false;
            });
        });

        it("[]", () => {
            validators.unique.bind(mockContext)([], res => {
                expect(res).to.be.false;
            });
        });

        it("{}", () => {
            validators.unique.bind(mockContext)({}, res => {
                expect(res).to.be.false;
            });
        });

        it("not unique", () => {
            validators.unique.bind(mockContext)("cell1", res => {
                expect(res).to.be.false;
            });
        });

        it("unique", () => {
            validators.unique.bind(mockContext)("cell3", res => {
                expect(res).to.be.true;
            });
        });

    });

});
