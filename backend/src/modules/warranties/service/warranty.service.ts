import { prisma } from "../../../config/prisma";
import { CreateWarrantyInput, UpdateWarrantyInput } from "../schemas/warranty.schema";

export const createWarranty = async (data: CreateWarrantyInput) => {
    const warranty = await prisma.warranty.create({
        data: {
            ...data,
            validUntil: new Date(data.validUntil),
        },
    });
    return warranty;
};

export const getWarrantyByInvoice = async (invoiceId: string,) => {
    const warranty = await prisma.warranty.findUnique({
        where: { invoiceId },
    });
    return warranty;
};

export const updateWarranty = async (invoiceId: string, data: UpdateWarrantyInput) => {
    const warranty = await prisma.warranty.update({
        where: { invoiceId },
        data: {
            ...data,
            validUntil: new Date(data.validUntil),
        },
    });
    return warranty;
};

export const deleteWarranty = async (invoiceId: string) => {
    const warranty = await prisma.warranty.delete({
        where: { invoiceId },
    });
    return warranty;
}