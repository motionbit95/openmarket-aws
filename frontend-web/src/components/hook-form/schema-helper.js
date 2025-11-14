import dayjs from "dayjs";
import { z as zod } from "zod";

// ----------------------------------------------------------------------

export const schemaHelper = {
  /**
   * 전화번호
   * 전화번호 입력에 사용
   */
  phoneNumber: (props) =>
    zod
      .string({
        required_error: props?.message?.required ?? "전화번호를 입력해주세요.",
      })
      .min(1, {
        message: props?.message?.required ?? "전화번호를 입력해주세요.",
      }),
  /**
   * 날짜
   * date picker 등에 사용
   */
  date: (props) =>
    zod.coerce
      .date()
      .nullable()
      .transform((dateString, ctx) => {
        const date = dayjs(dateString).format();
        const stringToDate = zod.string().pipe(zod.coerce.date());

        if (!dateString) {
          ctx.addIssue({
            code: zod.ZodIssueCode.custom,
            message: props?.message?.required ?? "날짜를 선택해주세요.",
          });
          return null;
        }

        if (!stringToDate.safeParse(date).success) {
          ctx.addIssue({
            code: zod.ZodIssueCode.invalid_date,
            message: props?.message?.invalid_type ?? "유효한 날짜가 아닙니다.",
          });
        }

        return date;
      })
      .pipe(zod.union([zod.number(), zod.string(), zod.date(), zod.null()])),

  /**
   * 에디터
   * defaultValue === '' 또는 <p></p>
   */
  editor: (props) =>
    zod.string().min(8, { message: props?.message ?? "내용을 입력해주세요." }),

  /**
   * 널 허용 입력
   * null 값이 가능한 입력(select 등)에 사용
   */
  nullableInput: (schema, options) =>
    schema.nullable().transform((val, ctx) => {
      if (val === null || val === undefined) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message: options?.message ?? "이 항목은 비워둘 수 없습니다.",
        });
        return val;
      }
      return val;
    }),

  /**
   * 불리언
   * 체크박스, 스위치 등에 사용
   */
  boolean: (props) =>
    zod.boolean({ coerce: true }).refine((val) => val === true, {
      message: props?.message ?? "필수 항목입니다.",
    }),

  /**
   * 슬라이더 범위
   * [최솟값, 최댓값] 범위 지정
   */
  sliderRange: (props) =>
    zod
      .number()
      .array()
      .refine((data) => data[0] >= props?.min && data[1] <= props?.max, {
        message:
          props.message ??
          `${props?.min} 이상 ${props?.max} 이하의 값을 선택해주세요.`,
      }),

  /**
   * 파일
   * 단일 파일 업로드에 사용
   */
  file: (props) =>
    zod.custom().transform((data, ctx) => {
      const hasFile =
        data instanceof File || (typeof data === "string" && !!data.length);

      if (!hasFile) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message: props?.message ?? "파일을 업로드해주세요.",
        });
        return null;
      }

      return data;
    }),

  /**
   * 파일 배열
   * 여러 개 파일 업로드에 사용
   */
  files: (props) =>
    zod.array(zod.custom()).transform((data, ctx) => {
      const minFiles = props?.minFiles ?? 2;

      if (!data.length) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message: props?.message ?? "파일을 업로드해주세요.",
        });
      } else if (data.length < minFiles) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message: `최소 ${minFiles}개 이상의 파일이 필요합니다.`,
        });
      }

      return data;
    }),
};
